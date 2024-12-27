use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Stream;
use ringbuf::storage::Heap;
use ringbuf::traits::{Consumer, Producer, Split};
use ringbuf::wrap::caching::Caching;
use ringbuf::{HeapRb, SharedRb};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::sync::{
    mpsc::{self, SendError},
    Arc,
};

const RING_BUFFER_SIZE: usize = 5_760_000; // 5,760,000 samples minimum

#[derive(Debug)]
pub enum AudioCommand {
    CloseThread,
    EnumerateRecordingDevices,
    InitRecordingSession(String),
    CloseRecordingSession,
    StartRecording,
    StopRecording,
}

#[derive(Debug)]
pub enum AudioResponse {
    RecordingDeviceList(Vec<String>),
    AudioData(Vec<f32>),
    Error(String),
    Success(String),
}

pub struct RecordingSession {
    stream: Stream,
    is_recording: Arc<AtomicBool>,
    consumer: Arc<Mutex<Caching<Arc<SharedRb<Heap<f32>>>, false, true>>>,
}

pub fn spawn_audio_thread(
    response_tx: mpsc::Sender<AudioResponse>,
) -> Result<mpsc::Sender<AudioCommand>, SendError<AudioCommand>> {
    let (tx, rx) = mpsc::channel();

    std::thread::spawn(move || -> Result<(), SendError<AudioResponse>> {
        let host = cpal::default_host();
        let mut current_session: Option<RecordingSession> = None;

        while let Ok(cmd) = rx.recv() {
            match cmd {
                AudioCommand::EnumerateRecordingDevices => {
                    let devices = host
                        .input_devices()
                        .map(|devices| devices.filter_map(|d| d.name().ok()).collect())
                        .unwrap_or_else(|e| {
                            let _ = response_tx.send(AudioResponse::Error(e.to_string()));
                            vec![]
                        });
                    response_tx.send(AudioResponse::RecordingDeviceList(devices))?;
                }

                AudioCommand::InitRecordingSession(device_name) => {
                    // Create a new ring buffer and wrap it in Arc for thread-safe sharing
                    let rb = HeapRb::<f32>::new(RING_BUFFER_SIZE);
                    let (rb_producer, rb_consumer) = rb.split();

                    let producer = Arc::new(Mutex::new(rb_producer));
                    let consumer = Arc::new(Mutex::new(rb_consumer));
                    let is_recording: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
                    let is_recording_producer = is_recording.clone();
                    let producer_clone = producer.clone();

                    let device = match host.input_devices() {
                        Ok(mut devices) => {
                            match devices
                                .find(|d| matches!(d.name(), Ok(name) if name == device_name))
                            {
                                Some(device) => device,
                                None => {
                                    response_tx.send(AudioResponse::Error(
                                        "Device not found".to_string(),
                                    ))?;
                                    continue;
                                }
                            }
                        }
                        Err(e) => {
                            response_tx.send(AudioResponse::Error(e.to_string()))?;
                            continue;
                        }
                    };

                    let config = match device.default_input_config() {
                        Ok(config) => {
                            println!(
                                "Initializing recording with sample rate: {} Hz",
                                config.sample_rate().0
                            );
                            config
                        }
                        Err(e) => {
                            response_tx.send(AudioResponse::Error(e.to_string()))?;
                            continue;
                        }
                    };

                    let sample_rate = config.sample_rate().0;
                    let stream = match device.build_input_stream(
                        &config.into(),
                        move |data: &[f32], _: &_| {
                            if is_recording_producer.load(Ordering::Relaxed) {
                                if let Ok(mut producer) = producer_clone.lock() {
                                    println!(
                                        "Audio callback received {} samples at {} Hz",
                                        data.len(),
                                        sample_rate
                                    );
                                    let mut pushed = 0;
                                    for &sample in data {
                                        if producer.try_push(sample).is_ok() {
                                            pushed += 1;
                                        }
                                    }
                                    println!("Successfully pushed {} samples", pushed);
                                }
                            }
                        },
                        |err| eprintln!("Error in stream: {}", err),
                        None,
                    ) {
                        Ok(stream) => stream,
                        Err(e) => {
                            response_tx.send(AudioResponse::Error(format!(
                                "Failed to build stream: {}",
                                e
                            )))?;
                            continue;
                        }
                    };

                    current_session = Some(RecordingSession {
                        stream,
                        is_recording,
                        consumer,
                    });

                    response_tx.send(AudioResponse::Success(
                        "Recording session initialized".to_string(),
                    ))?;
                }

                AudioCommand::StartRecording => {
                    if let Some(session) = &current_session {
                        session.is_recording.store(true, Ordering::Relaxed);
                        if let Err(e) = session.stream.play() {
                            response_tx.send(AudioResponse::Error(format!(
                                "Failed to start stream: {}",
                                e
                            )))?;
                            continue;
                        }
                        response_tx
                            .send(AudioResponse::Success("Recording started".to_string()))?;
                    } else {
                        response_tx.send(AudioResponse::Error(
                            "Recording session not initialized".to_string(),
                        ))?;
                    }
                }

                AudioCommand::StopRecording => {
                    if let Some(session) = &current_session {
                        // First stop recording to prevent new data from coming in
                        session.is_recording.store(false, Ordering::Relaxed);

                        // Then collect all available audio data
                        let mut audio_data = Vec::new();
                        if let Ok(mut consumer) = session.consumer.lock() {
                            while let Some(sample) = consumer.try_pop() {
                                audio_data.push(sample);
                            }
                        }
                        println!("Collected {} samples from recording", audio_data.len());

                        // Finally stop the stream
                        session.stream.pause().unwrap_or_default();

                        response_tx.send(AudioResponse::AudioData(audio_data))?;
                    } else {
                        response_tx
                            .send(AudioResponse::Error("No active recording".to_string()))?;
                    }
                }

                AudioCommand::CloseRecordingSession => {
                    if let Some(session) = current_session.take() {
                        session.is_recording.store(false, Ordering::Relaxed);
                        drop(session.stream);
                        response_tx.send(AudioResponse::Success(
                            "Recording session closed".to_string(),
                        ))?;
                    } else {
                        response_tx.send(AudioResponse::Success(
                            "No active recording session".to_string(),
                        ))?;
                    }
                }

                AudioCommand::CloseThread => {
                    if let Some(session) = current_session.take() {
                        session.is_recording.store(false, Ordering::Relaxed);
                        drop(session.stream);
                    }
                    response_tx.send(AudioResponse::Success("Thread closed".to_string()))?;
                    break;
                }
            }
        }
        Ok(())
    });

    Ok(tx)
}

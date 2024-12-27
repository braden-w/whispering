use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Stream;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::sync::{
    mpsc::{self, SendError},
    Arc,
};

const INITIAL_BUFFER_CAPACITY: usize = 5_760_000; // Pre-allocate for ~2 minutes at 48kHz

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
    audio_buffer: Arc<Mutex<Vec<f32>>>,
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
                    // Create a new pre-allocated buffer for storing audio data
                    let audio_buffer =
                        Arc::new(Mutex::new(Vec::with_capacity(INITIAL_BUFFER_CAPACITY)));
                    let is_recording: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
                    let is_recording_producer = is_recording.clone();
                    let buffer_clone = audio_buffer.clone();

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
                                if let Ok(mut buffer) = buffer_clone.lock() {
                                    // Extend the buffer with new samples
                                    buffer.extend_from_slice(data);
                                    println!(
                                        "Recorded {} samples, total length: {} ({:.2} seconds)",
                                        data.len(),
                                        buffer.len(),
                                        buffer.len() as f32 / sample_rate as f32
                                    );
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
                        audio_buffer,
                    });

                    response_tx.send(AudioResponse::Success(
                        "Recording session initialized".to_string(),
                    ))?;
                }

                AudioCommand::StartRecording => {
                    if let Some(session) = &current_session {
                        // Clear any existing data when starting a new recording
                        if let Ok(mut buffer) = session.audio_buffer.lock() {
                            buffer.clear();
                        }

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

                        // Get a copy of all recorded audio data
                        let audio_data = if let Ok(buffer) = session.audio_buffer.lock() {
                            buffer.clone()
                        } else {
                            Vec::new()
                        };

                        println!("Recorded {} samples total", audio_data.len());

                        // Stop the stream
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

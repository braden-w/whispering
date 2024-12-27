use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    Stream,
};
use ringbuf::{Consumer, HeapRb, Producer};
use serde::{Deserialize, Serialize};
use std::sync::mpsc::{self, SendError};

const RING_BUFFER_SIZE: usize = 32768; // 32KB buffer

#[derive(Debug, Clone)]
pub enum RecordingState {
    Idle,
    Initialized,
    Recording,
    Paused,
    Error(String),
}

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

struct RecordingSession {
    stream: Stream,
    producer: Producer<f32>,
    consumer: Consumer<f32>,
}

pub fn spawn_audio_thread(
    response_tx: mpsc::Sender<AudioResponse>,
) -> Result<mpsc::Sender<AudioCommand>, SendError<AudioCommand>> {
    let (tx, rx) = mpsc::channel();

    std::thread::spawn(move || -> Result<(), SendError<AudioResponse>> {
        let host = cpal::default_host();
        let mut current_recording_session: Option<RecordingSession> = None;

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
                    if current_recording_session.is_some() {
                        response_tx.send(AudioResponse::Success(
                            "Recording session already initialized".to_string(),
                        ))?;
                        continue;
                    }

                    let device = match host.input_devices() {
                        Ok(devices) => {
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
                        Ok(config) => config,
                        Err(e) => {
                            response_tx.send(AudioResponse::Error(e.to_string()))?;
                            continue;
                        }
                    };

                    let ring_buffer = HeapRb::new(RING_BUFFER_SIZE);
                    let (producer, consumer) = ring_buffer.split();

                    let producer_clone = producer.clone();
                    let stream = match device.build_input_stream(
                        &config.into(),
                        move |data: &[f32], _: &_| {
                            // Write to ring buffer in the audio callback
                            for &sample in data {
                                // Non-blocking write - drop samples if buffer is full
                                let _ = producer_clone.push(sample);
                            }
                        },
                        |err| eprintln!("Error in audio stream: {}", err),
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

                    current_recording_session = Some(RecordingSession {
                        stream,
                        producer,
                        consumer,
                    });

                    response_tx.send(AudioResponse::Success(
                        "Recording session initialized".to_string(),
                    ))?;
                }
                AudioCommand::StartRecording => {
                    if let Some(session) = &current_recording_session {
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
                    if let Some(session) = &current_recording_session {
                        session.stream.pause().unwrap_or_default();

                        // Collect any remaining data from the ring buffer
                        let mut audio_data = Vec::new();
                        while let Some(sample) = session.consumer.pop() {
                            audio_data.push(sample);
                        }

                        response_tx.send(AudioResponse::AudioData(audio_data))?;
                    } else {
                        response_tx
                            .send(AudioResponse::Error("No active recording".to_string()))?;
                    }
                }
                AudioCommand::CloseRecordingSession => {
                    if let Some(session) = current_recording_session.take() {
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
                    if let Some(session) = current_recording_session.take() {
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

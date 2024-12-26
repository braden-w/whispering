use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::{Arc, Mutex};


pub fn enumerate_audio_device_names() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let host = cpal::default_host();
    let devices = host.input_devices()?;
    let device_names = devices
        .map(|device| device.name())
        .collect::<Result<Vec<_>, _>>()?;
    Ok(device_names)
}

fn start_recording(device_id: String, duration: u64) -> Result<(), Box<dyn std::error::Error>> {
    let host = cpal::default_host();
    let device = host
        .input_devices()?
        .find(|d| matches!(d.name(), Ok(name) if name == device_id))
        .ok_or("Error finding device")?;

    println!("Recording using default input device: {}", device.name()?);

    let config = device.default_input_config()?;
    println!("Using input config: {:?}", config);
    let spec = hound::WavSpec {
        channels: config.channels(),
        sample_rate: config.sample_rate().0,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };

    let writer = Arc::new(Mutex::new(hound::WavWriter::create("output.wav", spec)?));
    let writer_clone = writer.clone();
    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            if let Ok(mut writer) = writer_clone.lock() {
                for &sample in data {
                    let _ = writer.write_sample(sample);
                }
            }
        },
        |err| eprintln!("Error in stream: {}", err),
        None,
    )?;

    stream.play()?;
    std::thread::sleep(std::time::Duration::from_secs(duration));
    drop(stream);

    Ok(())
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_to_mp3])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use std::process::Command;

#[tauri::command]
fn convert_to_mp3(input: &str, output: &str) -> Result<String, String> {
    let status = Command::new("lame").arg(input).arg(output).status();

    match status {
        Ok(_) => Ok(output.into()),
        Err(e) => {
            eprintln!("Failed to execute the lame command: {}", e);
            Err(format!("Failed to execute the lame command: {}", e).into())
        }
    }
}

use reqwest::multipart;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
struct TextResponse {
    text: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ErrorMessage {
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ErrorResponse {
    error: ErrorMessage,
}

#[derive(Debug)]
enum Response {
    Text(TextResponse),
    Error(ErrorResponse),
}

impl Response {
    fn from_json(value: Value) -> Result<Response, serde_json::Error> {
        if let Some(text) = value.get("text") {
            let text_response: TextResponse = serde_json::from_value(value)?;
            Ok(Response::Text(text_response))
        } else if let Some(error) = value.get("error") {
            let error_response: ErrorResponse = serde_json::from_value(value)?;
            Ok(Response::Error(error_response))
        } else {
            Err(serde_json::Error::custom("Invalid response"))
        }
    }
}

#[tauri::command]
pub async fn transcribe_audio(audio_blob: Vec<u8>) -> Result<(), String> {
    // Create the multipart form data
    let file_part = multipart::Part::bytes(audio_blob).file_name("recording.wav");
    let form = multipart::Form::new()
        .part("file", file_part)
        .text("model", "Systran/faster-whisper-tiny.en");

    // Make the POST request
    let client = Client::new();
    let response = client
        .post("http://localhost:8000/v1/audio/transcriptions")
        .multipart(form)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        Err(format!("Request failed with status: {}", response.status()))
    }
    let response_json = response
        .json::<serde_json::Value>()
        .await
        .map_err(|err| err.to_string())?;
    let response = Response::from_json(response_json).map_err(|err| err.to_string())?;
    match response {
        Response::Text(text_response) => {
            println!("Text response: {}", text_response.text);
            Ok(text_response.text)
        }
        Response::Error(error_response) => {
            println!("Error response: {}", error_response.error.message);
            Err(error_response.error.message)
        }
    }
}

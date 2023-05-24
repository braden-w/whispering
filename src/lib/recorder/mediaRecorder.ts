/**
 * This implementation uses the native mediaRecorder api.
 * Unfortunately, it didn't reliably work with Safari or Tauri.
 *
 * For the main implementation, see {@link ./recordRtcRecorder.ts}.
 */
import octagonalSign from "data-base64:~assets/octagonal_sign.png"
import studioMicrophone from "data-base64:~assets/studio_microphone.png"

let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []

export async function startRecording(): Promise<void> {
  const stream = await getMicrophonePermissions()
  mediaRecorder = new MediaRecorder(stream)
  mediaRecorder.addEventListener("dataavailable", (event: BlobEvent) => {
    recordedChunks.push(event.data)
  })
  mediaRecorder.start()
  chrome.action.setIcon({ path: octagonalSign })
}

export async function stopRecording(): Promise<Blob> {
  return new Promise((resolve) => {
    if (!mediaRecorder) throw new Error("MediaRecorder is not initialized.")
    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(recordedChunks, { type: "audio/wav" })
      recordedChunks = []
      resolve(audioBlob)
    })
    mediaRecorder.stop()
    chrome.action.setIcon({ path: studioMicrophone })
  })
}

async function getMicrophonePermissions() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (error) {
    chrome.runtime.openOptionsPage()
  }
}

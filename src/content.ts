import { writeText } from "~lib/apis/clipboard"
import { startRecording, stopRecording } from "~lib/recorder/mediaRecorder"
import { getApiKey } from "~lib/stores/apiKey"
import { transcribeAudioWithWhisperApi } from "~lib/transcribeAudioWithWhisperApi"

export {}
console.log("🚀 ~ file: content.ts:7 ~ export")

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  console.log("🚀 ~ file: content.ts:11 ~ request:", request)
  if (request.name === "startRecording") {
    console.log("🚀 ~ file: content.ts:14 ~ startRecording:")
    await startRecording()
    sendResponse()
  } else if (request.name === "stopRecording") {
    console.log("🚀 ~ file: content.ts:18 ~ stopRecording:")
    const audioBlob = await stopRecording()
    // const apiKey = await getApiKey()
    // const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey)
    // writeText(text)
    sendResponse({ audioBlob })
  }
})

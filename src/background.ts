// import toast from "svelte-french-toast/dist/core/toast"
import { Storage } from "@plasmohq/storage/dist"

import { writeText } from "~lib/apis/clipboard"
import { startRecording, stopRecording } from "~lib/recorder/mediaRecorder"
import { getApiKey } from "~lib/stores/apiKey"
// import PleaseEnterAPIKeyToast from "~lib/toasts/PleaseEnterAPIKeyToast.svelte"
// import SomethingWentWrongToast from "~lib/toasts/SomethingWentWrongToast.svelte"
import { transcribeAudioWithWhisperApi } from "~lib/transcribeAudioWithWhisperApi"

export {}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage()
  }
})

let isRecording = false
chrome.commands.onCommand.addListener(function (command) {
  if (command === "toggle-recording") {
    toggleRecording()
  }
})

async function toggleRecording() {
  const storage = new Storage()
  const apiKey = await getApiKey()
  if (!apiKey) {
    // toast.error(PleaseEnterAPIKeyToast)
    return
  }

  if (!isRecording) {
    await startRecording()
    isRecording = !isRecording
    chrome.action.setIcon({ path: octagonalSign })
  } else {
    const audioBlob = await stopRecording()
    isRecording = !isRecording
    chrome.action.setIcon({ path: studioMicrophone })
    const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey)
    writeText(text)
  }
}

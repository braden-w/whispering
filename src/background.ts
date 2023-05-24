import { sendToContentScript } from "@plasmohq/messaging"
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
  // if (!apiKey) {
  //   // toast.error(PleaseEnterAPIKeyToast)
  //   return
  // }

  if (!isRecording) {
    await sendActionToContentScript("startRecording")
    isRecording = !isRecording
  } else {
    const { audioBlob } = await sendActionToContentScript("stopRecording")
    console.log(
      "🚀 ~ file: background.ts:38 ~ toggleRecording ~ audioBlob:",
      audioBlob
    )
    // const audioBlob = await stopRecording()
    isRecording = !isRecording
    const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey)
    writeText(text)
  }
}

async function sendActionToContentScript(
  action: "startRecording" | "stopRecording"
) {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  })
  const response = await chrome.tabs.sendMessage(tab.id, {
    action
  })
  console.log("🚀 ~ file: background.ts:58 ~ response:", response)
  return response
}

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

chrome.commands.onCommand.addListener(async function (command) {
  if (command === "toggle-recording") {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    })
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "toggleRecording"
    })
    // toggleRecording()
  }
})

let isRecording = false

async function toggleRecording() {
  const storage = new Storage()
  const apiKey = await getApiKey()
  // if (!apiKey) {
  //   // toast.error(PleaseEnterAPIKeyToast)
  //   return
  // }

  if (!isRecording) {
    // sendToContentScript({
    //   name: "startRecording",
    //   body: { action: "startRecording" }
    // })
    // await sendActionToContentScript("startRecording")
    isRecording = !isRecording
  } else {
    // sendToContentScript({
    //   name: "stopRecording",
    //   body: { action: "stopRecording" }
    // })
    // const { audioBlob } = await sendActionToContentScript("stopRecording")
    // console.log(
    //   "🚀 ~ file: background.ts:38 ~ toggleRecording ~ audioBlob:",
    //   audioBlob
    // )
    // // const audioBlob = await stopRecording()
    isRecording = !isRecording
    // const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey)
    // writeText(text)
  }
}

async function sendActionToContentScript(
  actionName: "startRecording" | "stopRecording"
) {
  // const [tab] = await chrome.tabs.query({
  //   active: true,
  //   lastFocusedWindow: true
  // })
  // const response = await sendToContentScript({ name: actionName })
  const response = await chrome.runtime.sendMessage({ name: actionName })
  console.log("🚀 ~ file: background.ts:58 ~ response:", response)
  return response
}

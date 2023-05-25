import {
  getIsBackgroundRecording,
  toggleIsBackgroundRecording
} from "~lib/stores/isBackgroundRecording"

export {}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage()
  }
})

chrome.commands.onCommand.addListener(async function (command) {
  if (command === "toggle-recording") {
    await toggleRecording()
  }
})

async function toggleRecording() {
  let isRecording = await getIsBackgroundRecording()
  console.log(
    "🚀 ~ file: background.ts:19 ~ toggleRecording ~ isRecording:",
    isRecording
  )
  if (!isRecording) {
    const response = await sendActionToContentScript("startRecording")
    await toggleIsBackgroundRecording()
  } else {
    const response = await sendActionToContentScript("stopRecording")
    await toggleIsBackgroundRecording()
  }
}

async function sendActionToContentScript(
  actionName: "startRecording" | "stopRecording"
) {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  })
  const response = await chrome.tabs.sendMessage(tab.id, {
    name: actionName
  })
  return response
}

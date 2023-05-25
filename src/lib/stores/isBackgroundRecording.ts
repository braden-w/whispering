import { Storage } from "@plasmohq/storage/dist"

const storage = new Storage()

export async function getIsBackgroundRecording(): Promise<boolean> {
  return await storage.get<boolean>("is-background-recording")
}

async function setIsBackgroundRecording(value: boolean) {
  return await storage.set("is-background-recording", value)
}

export async function toggleIsBackgroundRecording() {
  const isRecording = await getIsBackgroundRecording()
  await storage.set("is-background-recording", !isRecording)
}

import { Storage } from "@plasmohq/storage/dist"

const storage = new Storage()

export async function getIsRecording(): Promise<boolean> {
  return await storage.get<boolean>("is-recording")
}

async function setIsRecording(value: boolean) {
  return await storage.set("is-recording", value)
}

export async function toggleIsRecording() {
  const isRecording = await getIsRecording()
  await storage.set("is-recording", !isRecording)
}

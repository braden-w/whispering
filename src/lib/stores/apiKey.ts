import { writable } from "svelte/store"

import { Storage } from "@plasmohq/storage/dist"

const storage = new Storage()

export async function getApiKey() {
  return await storage.get("openai-api-key")
}

export async function setApiKey(inputApiKey: string) {
  await storage.set("openai-api-key", inputApiKey)
}

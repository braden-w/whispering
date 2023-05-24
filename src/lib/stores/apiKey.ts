import { writable } from "svelte/store"

import { Storage } from "@plasmohq/storage/dist"

const storage = new Storage()

export const apiKey = writable("")
storage.get("openai-api-key").then((initialApiKey) => apiKey.set(initialApiKey))

export async function setApiKey(inputApiKey: string) {
  await storage.set("openai-api-key", inputApiKey)
  apiKey.set(inputApiKey)
}

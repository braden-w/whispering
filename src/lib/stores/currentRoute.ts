import { writable } from "svelte/store"

export type Route = "/" | "/setup"

export const currentRoute = writable<Route>("/")

export function goto(route: Route) {
  currentRoute.set(route)
}

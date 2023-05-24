import { writable } from "svelte/store"

type Route = "/" | "/setup"

export const currentRoute = writable<Route>("/")

export function goto(route: Route) {
  currentRoute.set(route)
}

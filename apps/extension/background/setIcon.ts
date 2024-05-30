import arrowsCounterclockwise from "data-base64:~assets/arrows_counterclockwise.png"
import redLargeSquare from "data-base64:~assets/red_large_square.png"
import studioMicrophone from "data-base64:~assets/studio_microphone.png"

export type Icon =
  | "studioMicrophone"
  | "redLargeSquare"
  | "arrowsCounterclockwise"

export function setIcon(icon: Icon) {
  switch (icon) {
    case "studioMicrophone":
      chrome.action.setIcon({ path: studioMicrophone })
      break
    case "redLargeSquare":
      chrome.action.setIcon({ path: redLargeSquare })
      break
    case "arrowsCounterclockwise":
      chrome.action.setIcon({ path: arrowsCounterclockwise })
      break
  }
}

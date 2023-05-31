import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';

export type Icon = 'studioMicrophone' | 'redLargeSquare' | 'arrowsCounterclockwise';

export function setIcon(icon: Icon) {
	if (icon === 'studioMicrophone') {
		chrome.action.setIcon({ path: studioMicrophone });
	} else if (icon === 'redLargeSquare') {
		chrome.action.setIcon({ path: redLargeSquare });
	} else if (icon === 'arrowsCounterclockwise') {
		chrome.action.setIcon({ path: arrowsCounterclockwise });
	}
}

import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import octagonalSign from 'data-base64:~assets/octagonal_sign.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';

export type Icon = 'studioMicrophone' | 'octagonalSign' | 'arrowsCounterclockwise';

export function setIcon(icon: Icon) {
	if (icon === 'studioMicrophone') {
		chrome.action.setIcon({ path: studioMicrophone });
	} else if (icon === 'octagonalSign') {
		chrome.action.setIcon({ path: octagonalSign });
	} else if (icon === 'arrowsCounterclockwise') {
		chrome.action.setIcon({ path: arrowsCounterclockwise });
	}
}

import { Effect } from 'effect';
import {
	registerOnCommandToggleRecording,
	registerOnInstallOpenOptionsPage,
	registerOnMessageExternalToggleRecording,
} from './registerListeners';

registerOnInstallOpenOptionsPage.pipe(Effect.runSync);
registerOnCommandToggleRecording.pipe(Effect.runSync);
registerOnMessageExternalToggleRecording.pipe(Effect.runSync);

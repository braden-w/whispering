import { Effect } from 'effect';
import { registerExternalListener } from './external-messages';
import {
	registerOnCommandToggleRecording,
	registerOnInstallOpenOptionsPage,
} from './registerListeners';

registerOnInstallOpenOptionsPage.pipe(Effect.runSync);
registerOnCommandToggleRecording.pipe(Effect.runSync);
registerExternalListener();

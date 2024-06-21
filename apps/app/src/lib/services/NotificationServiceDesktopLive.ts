import { NotificationService } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';

/**
 * Desktop implementation of the NotificationService that disables notifications.
 *
 * @remarks
 * This implementation is specifically designed for the desktop version of the
 * application, where notifications are intentionally disabled for several
 * reasons:
 *
 * 1. The application primarily uses notifications with a Chrome extension in
 * 		the web app.
 * 2. Desktop notifications don't allow replacing notifications in-place, which
 * 		is crucial for our use case of updating loading indicators. We use
 * 		notifications to show status updates (e.g., recording, transcribing,
 * 		completed), and the inability to override a notification from "loading" to
 * 		"complete" on desktop makes the feature less useful.
 * 3. There were build issues when notifications were enabled for the desktop
 * 		version.
 *
 * As a result, this implementation maintains the NotificationService interface
 * but doesn't actually send any notifications. It returns a unique ID for
 * `notify` to maintain compatibility with the rest of the application logic.
 */

export const NotificationServiceDesktopLive = Layer.succeed(
	NotificationService,
	NotificationService.of({
		notify: () => Effect.sync(() => nanoid()),
		clear: () => Effect.sync(() => {}),
	}),
);

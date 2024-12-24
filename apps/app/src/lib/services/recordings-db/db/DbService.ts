import type { ServiceFn } from '@repo/shared/epicenter-result';

type TranscriptionStatus = 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';

export type Recording = {
	id: string;
	title: string;
	subtitle: string;
	timestamp: string;
	transcribedText: string;
	blob: Blob;
	/**
	 * A recording
	 * 1. Begins in an 'UNPROCESSED' state
	 * 2. Moves to 'TRANSCRIBING' while the audio is being transcribed
	 * 3. Finally is marked as 'DONE' when the transcription is complete.
	 */
	transcriptionStatus: TranscriptionStatus;
};

export type RecordingsErrorProperties = {
	_tag: 'RecordingsError';
	title: string;
	description: string;
	action: { type: 'more-details'; error: unknown };
};

export type Recordings = {
	readonly getAllRecordings: ServiceFn<
		void,
		Recording[],
		RecordingsErrorProperties
	>;
	readonly getRecording: ServiceFn<
		string,
		Recording | null,
		RecordingsErrorProperties
	>;
	readonly addRecording: ServiceFn<Recording, void, RecordingsErrorProperties>;
	readonly updateRecording: ServiceFn<
		Recording,
		void,
		RecordingsErrorProperties
	>;
	readonly deleteRecordingById: ServiceFn<
		string,
		void,
		RecordingsErrorProperties
	>;
	readonly deleteRecordingsById: ServiceFn<
		string[],
		void,
		RecordingsErrorProperties
	>;
};

import { sendToBackground } from '@plasmohq/messaging';
import {
	MediaRecorderService,
	MediaRecorderServiceWebLive,
	type Settings,
	TranscriptionService,
	TranscriptionServiceWhisperLive,
} from '@repo/shared';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';
import * as GetSettings from '~background/messages/getSettings';
import { Button } from '~components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~components/ui/card';
import { Input } from '~components/ui/input';
import { Label } from '~components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~components/ui/select';
import { Switch } from '~components/ui/switch';
import { renderErrorAsToast } from '~lib/errors';
import './style.css';

const queryClient = new QueryClient();

function IndexPopup() {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="container flex items-center justify-center">
				<Card className="w-full max-w-xl">
					<CardHeader>
						<CardTitle className="text-xl">Settings</CardTitle>
						<CardDescription>Customize your Whispering experience</CardDescription>
					</CardHeader>
					<Settings />
					<CardFooter>
						<Button asChild className="w-full" variant="secondary">
							<a href="/">Go Back</a>
						</Button>
					</CardFooter>
				</Card>
			</div>
		</QueryClientProvider>
	);
}

function Settings() {
	const {
		isLoading: isSettingsLoading,
		isError: isSettingsError,
		data: settings,
	} = useQuery({
		queryKey: ['settings'],
		queryFn: () =>
			sendToBackground<GetSettings.RequestBody, GetSettings.ResponseBody>({
				name: 'getSettings',
			}).then((response) => {
				if (!response.isSuccess) throw response.error;
				return response.data;
			}),
	});

	const getMediaDevicesPromise = useQuery({
		queryKey: ['media-devices'],
		queryFn: () =>
			Effect.gen(function* () {
				const mediaRecorderService = yield* MediaRecorderService;
				return yield* mediaRecorderService.enumerateRecordingDevices;
			}).pipe(
				Effect.catchAll((error) => {
					renderErrorAsToast(error);
					return Effect.succeed([] as MediaDeviceInfo[]);
				}),
				Effect.provide(MediaRecorderServiceWebLive),
				Effect.runPromise,
			),
	});

	const supportedLanguagesOptions = Effect.gen(function* () {
		const transcriptionService = yield* TranscriptionService;
		const languages = transcriptionService.supportedLanguages;
		return languages;
	}).pipe(Effect.provide(TranscriptionServiceWhisperLive), Effect.runSync);

	if (isSettingsLoading) {
		return <CardContent>Loading...</CardContent>;
	}

	if (isSettingsError) {
		return <CardContent>Error loading settings</CardContent>;
	}

	if (!settings) {
		return <CardContent>No settings found</CardContent>;
	}

	return (
		<CardContent className="space-y-6">
			<div className="flex items-center gap-2">
				<Switch
					id="play-sound-enabled"
					aria-labelledby="play-sound-enabled"
					checked={settings.isPlaySoundEnabled}
					onCheckedChange={() => {}}
				/>
				<Label htmlFor="play-sound-enabled">Play sound on toggle on and off</Label>
			</div>
			<div className="flex items-center gap-2">
				<Switch
					id="copy-to-clipboard"
					aria-labelledby="copy-to-clipboard"
					checked={settings.isCopyToClipboardEnabled}
					onCheckedChange={() => {}}
				/>
				<Label htmlFor="copy-to-clipboard">
					Copy text to clipboard on successful transcription
				</Label>
			</div>
			<div className="flex items-center gap-2">
				<Switch
					id="paste-from-clipboard"
					aria-labelledby="paste-from-clipboard"
					checked={settings.isPasteContentsOnSuccessEnabled}
					onCheckedChange={() => {}}
				/>
				<Label htmlFor="paste-from-clipboard">
					Paste contents from clipboard after successful transcription
				</Label>
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="recording-device">
					Recording Device
				</Label>
				{getMediaDevicesPromise.isLoading && (
					<Select disabled>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Loading devices..." />
						</SelectTrigger>
					</Select>
				)}
				{getMediaDevicesPromise.isError && (
					<Select disabled>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Error loading devices" />
						</SelectTrigger>
					</Select>
				)}
				{getMediaDevicesPromise.isSuccess && (
					<RenderMediaDevices devices={getMediaDevicesPromise.data} />
				)}
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="output-language">
					Output Language
				</Label>
				<Select
					items={supportedLanguagesOptions}
					selected={selectedLanguageOption}
					onSelectedChange={(selected) => {
						if (!selected) return;
						settings.outputLanguage = selected.value;
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a device" />
					</SelectTrigger>
					<SelectContent className="max-h-96 overflow-auto">
						{supportedLanguagesOptions.map((supportedLanguagesOption) => (
							<SelectItem value={supportedLanguagesOption.value}>
								{supportedLanguagesOption.label}
							</SelectItem>
						))}
					</SelectContent>
					{/* <SelectInput name="output-language" /> */}
				</Select>
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="local-shortcut">
					Local Shortcut
				</Label>
				<Input
					id="local-shortcut"
					placeholder="Local Shortcut to toggle recording"
					value={settings.currentLocalShortcut}
					type="text"
					autocomplete="off"
				/>
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="global-shortcut">
					Global Shortcut
				</Label>
				{settings.isGlobalShortcutEnabled ? (
					<Input
						id="global-shortcut"
						placeholder="Global Shortcut to toggle recording"
						value={settings.currentGlobalShortcut}
						type="text"
						autocomplete="off"
					/>
				) : (
					<div className="relative">
						<Input
							id="global-shortcut"
							placeholder="Global Shortcut to toggle recording"
							value={settings.currentGlobalShortcut}
							type="text"
							autocomplete="off"
							disabled
						/>
						<Button
							className="absolute inset-0 backdrop-blur"
							href="/global-shortcut"
							variant="link"
						>
							Enable Global Shortcut
						</Button>
					</div>
				)}
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="api-key">
					API Key
				</Label>
				<Input
					id="api-key"
					placeholder="Your OpenAI API Key"
					value={settings.apiKey}
					type="text"
					autoComplete="off"
				/>
			</div>
		</CardContent>
	);
}

function RenderMediaDevices({ mediaDevices }: { mediaDevices: MediaDeviceInfo[] }) {
	const items = mediaDevices.map((device) => ({
		value: device.deviceId,
		label: device.label,
	}));
	const selected = items.find((item) => item.value === settings.selectedAudioInputDeviceId);
	return (
		<Select
			items={items}
			selected={selected}
			onSelectedChange={(selected) => {
				if (!selected) return;
				settings.selectedAudioInputDeviceId = selected.value;
			}}
		>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="Select a device" />
			</SelectTrigger>
			<SelectContent>
				{mediaDevices.map((device) => (
					<SelectItem value={device.deviceId} label={device.label}>
						{device.label}
					</SelectItem>
				))}
			</SelectContent>
			<SelectInput name="recording-device" />
		</Select>
	);
}

export default IndexPopup;

import { sendToBackground } from '@plasmohq/messaging';
import {
	TranscriptionService,
	TranscriptionServiceWhisperLive,
	WHISPERING_URL,
	type Settings,
} from '@repo/shared';
import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { Effect } from 'effect';
import * as GetSettings from '~background/messages/getSettings';
import * as SetSettings from '~background/messages/setSettings';
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
import './style.css';

const queryClient = new QueryClient();

function IndexPopup() {
	return (
		<QueryClientProvider client={queryClient}>
			<main className="flex min-h-screen items-center justify-center">
				<Card className="w-full max-w-xl">
					<CardHeader>
						<CardTitle className="text-xl">Settings</CardTitle>
						<CardDescription>
							Customize your Whispering experience. Synced with the{' '}
							<Button
								variant="link"
								className="h-fit px-0.5 py-0"
								onClick={() => chrome.tabs.create({ url: WHISPERING_URL })}
							>
								Whispering website
							</Button>
							!
						</CardDescription>
					</CardHeader>
					<Settings />
					<CardFooter>
						<Button asChild className="w-full" variant="secondary">
							<a href="/">Go Back</a>
						</Button>
					</CardFooter>
				</Card>
			</main>
		</QueryClientProvider>
	);
}

function Settings() {
	const queryClient = useQueryClient();

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

	const setSettings = useMutation({
		mutationFn: (settings: Settings) =>
			sendToBackground<SetSettings.RequestBody, SetSettings.ResponseBody>({
				name: 'setSettings',
				body: { settings },
			}).then((response) => {
				if (!response.isSuccess) throw response.error;
				return response.data;
			}),
		onMutate: async (newSettings) => {
			await queryClient.cancelQueries({ queryKey: ['settings'] });
			const previousSettingsSnapshot = queryClient.getQueryData(['settings']) as Settings;
			queryClient.setQueryData(['settings'], newSettings);
			return { previousSettingsSnapshot, newSettings };
		},
		onError: (err, newSettings, context) => {
			if (!context) return;
			queryClient.setQueryData(['settings'], context.previousSettingsSnapshot);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['settings'] });
		},
	});

	const {
		isLoading: isMediaDevicesLoading,
		isError: isMediaDevicesError,
		data: mediaDevices,
	} = useQuery({
		queryKey: ['media-devices'],
		queryFn: async () => {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const devices = await navigator.mediaDevices.enumerateDevices();
			stream.getTracks().forEach((track) => track.stop());
			const audioInputDevices = devices.filter((device) => device.kind === 'audioinput');
			return audioInputDevices;
		},
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
					onCheckedChange={(newValue) =>
						setSettings.mutate({ ...settings, isPlaySoundEnabled: newValue })
					}
				/>
				<Label htmlFor="play-sound-enabled">Play sound on toggle on and off</Label>
			</div>
			<div className="flex items-center gap-2">
				<Switch
					id="copy-to-clipboard"
					aria-labelledby="copy-to-clipboard"
					checked={settings.isCopyToClipboardEnabled}
					onCheckedChange={(newValue) =>
						setSettings.mutate({
							...settings,
							isCopyToClipboardEnabled: newValue,
						})
					}
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
					onCheckedChange={(newValue) =>
						setSettings.mutate({
							...settings,
							isPasteContentsOnSuccessEnabled: newValue,
						})
					}
				/>
				<Label htmlFor="paste-from-clipboard">
					Paste contents from clipboard after successful transcription
				</Label>
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="recording-device">
					Recording Device
				</Label>
				{isMediaDevicesLoading && (
					<Select disabled>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Loading devices..." />
						</SelectTrigger>
					</Select>
				)}
				{isMediaDevicesError && (
					<Select disabled>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Error loading devices" />
						</SelectTrigger>
					</Select>
				)}
				{mediaDevices && (
					<Select
						value={settings.selectedAudioInputDeviceId}
						onValueChange={(value) =>
							setSettings.mutate({
								...settings,
								selectedAudioInputDeviceId: value,
							})
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select a device" />
						</SelectTrigger>
						<SelectContent>
							{mediaDevices.map((device) => (
								<SelectItem key={device.deviceId} value={device.deviceId}>
									{device.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="output-language">
					Output Language
				</Label>
				<Select
					value={settings.outputLanguage}
					onValueChange={(value) => setSettings.mutate({ ...settings, outputLanguage: value })}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a device" />
					</SelectTrigger>
					<SelectContent className="max-h-96 overflow-auto">
						{supportedLanguagesOptions.map((supportedLanguagesOption) => (
							<SelectItem
								key={supportedLanguagesOption.value}
								value={supportedLanguagesOption.value}
							>
								{supportedLanguagesOption.label}
							</SelectItem>
						))}
					</SelectContent>
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
					onChange={(e) => {
						setSettings.mutate({
							...settings,
							currentLocalShortcut: e.target.value,
						});
					}}
					type="text"
					autoComplete="off"
				/>
			</div>
			<div className="grid gap-2">
				<Label className="text-sm" htmlFor="global-shortcut">
					Global Shortcut
				</Label>
				<div className="relative">
					<Input
						id="global-shortcut"
						placeholder="Global Shortcut to toggle recording"
						type="text"
						autoComplete="off"
						disabled
					/>
					<Button
						className="absolute inset-0 backdrop-blur"
						variant="link"
						onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })}
					>
						Edit Global Shortcut in Extension Settings
					</Button>
				</div>
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

export default IndexPopup;

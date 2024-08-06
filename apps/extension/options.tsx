import { sendToBackground } from '@plasmohq/messaging';
import {
	SUPPORTED_LANGUAGES_OPTIONS,
	TRANSCRIPTION_SERVICE_OPTIONS,
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
import * as GetSettings from '~background/messages/contents/getSettings';
import * as SetSettings from '~background/messages/contents/setSettings';
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
import { Fragment } from 'react';

const queryClient = new QueryClient();

function IndexPopup() {
	return (
		<QueryClientProvider client={queryClient}>
			<main className="flex min-h-screen items-center justify-center">
				<SettingsCard />
			</main>
		</QueryClientProvider>
	);
}

function SettingsCard() {
	const queryClient = useQueryClient();

	const {
		isPending: isSettingsPending,
		isError: isSettingsError,
		data: settings,
	} = useQuery({
		queryKey: ['settings'],
		queryFn: () =>
			sendToBackground<GetSettings.RequestBody, GetSettings.ResponseBody>({
				name: 'contents/getSettings',
			}).then((response) => {
				if (!response.isSuccess) throw response.error;
				return response.data;
			}),
	});

	const { mutate: setSettings } = useMutation({
		mutationFn: (settings: Settings) =>
			sendToBackground<SetSettings.RequestBody, SetSettings.ResponseBody>({
				name: 'contents/setSettings',
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
		isPending: isMediaDevicesPending,
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

	if (isSettingsPending) {
		return <CardContent>Loading...</CardContent>;
	}

	if (isSettingsError) {
		return <CardContent>Error loading settings</CardContent>;
	}

	if (!settings) {
		return <CardContent>No settings found</CardContent>;
	}

	return (
		<Card className="w-full max-w-xl">
			<CardHeader>
				<CardTitle className="text-xl">Settings</CardTitle>
				<CardDescription>
					Customize your Whispering experience. Synced with the{' '}
					<Button
						variant="link"
						size="inline"
						onClick={() => chrome.tabs.create({ url: WHISPERING_URL })}
					>
						Whispering website
					</Button>
					!
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center gap-2">
					<Switch
						id="play-sound-enabled"
						aria-labelledby="play-sound-enabled"
						checked={settings.isPlaySoundEnabled}
						onCheckedChange={(newValue) =>
							setSettings({ ...settings, isPlaySoundEnabled: newValue })
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
							setSettings({
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
							setSettings({
								...settings,
								isPasteContentsOnSuccessEnabled: newValue,
							})
						}
					/>
					<Label htmlFor="paste-from-clipboard">
						Paste contents from clipboard after successful transcription
					</Label>
				</div>

				<div className="grid-gap-2">
					<SettingsLabelSelect
						id="recording-device"
						label="Recording Device"
						placeholder={
							isMediaDevicesPending
								? 'Loading devices...'
								: isMediaDevicesError
									? 'Error loading devices'
									: 'Select a device'
						}
						options={
							mediaDevices?.map((mediaDevice) => ({
								label: mediaDevice.label,
								value: mediaDevice.deviceId,
							})) ?? []
						}
						disabled={isMediaDevicesPending || isMediaDevicesError}
						value={settings.selectedAudioInputDeviceId}
						onValueChange={(value) =>
							setSettings({
								...settings,
								selectedAudioInputDeviceId: value,
							})
						}
					/>
				</div>

				<div className="grid-gap-2">
					<SettingsLabelSelect
						id="output-language"
						label="Output Language"
						options={SUPPORTED_LANGUAGES_OPTIONS}
						value={settings.outputLanguage}
						onValueChange={(value) => setSettings({ ...settings, outputLanguage: value })}
					/>
				</div>

				<div className="grid gap-2">
					<SettingsLabelInput
						id="local-shortcut"
						label="Local Shortcut"
						value={settings.currentLocalShortcut}
						onChange={(value) => setSettings({ ...settings, currentLocalShortcut: value })}
						placeholder="Local Shortcut to toggle recording"
					/>
				</div>

				<div className="grid gap-2">
					<SettingsLabelInput
						id="global-shortcut"
						label="Global Shortcut"
						value={settings.currentGlobalShortcut}
						onChange={(value) => setSettings({ ...settings, currentGlobalShortcut: value })}
						placeholder="Global Shortcut to toggle recording"
						disabled
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

				<div className="grid-gap-2">
					<SettingsLabelSelect
						id="selected-transcription-service"
						label="Transcription Service"
						options={TRANSCRIPTION_SERVICE_OPTIONS}
						value={settings.selectedTranscriptionService}
						onValueChange={(value) =>
							setSettings({ ...settings, selectedTranscriptionService: value })
						}
					/>
				</div>

				{settings.selectedTranscriptionService === 'OpenAI' ? (
					<div className="grid gap-2">
						<SettingsLabelInput
							id="openai-api-key"
							label="OpenAI API Key"
							value={settings.openAiApiKey}
							onChange={(value) =>
								setSettings({
									...settings,
									openAiApiKey: value,
								})
							}
							placeholder="Your OpenAI API Key"
							type="password"
						/>
						<div className="text-muted-foreground text-sm">
							You can find your OpenAI API key in your{' '}
							<Button
								variant="link"
								className="px-0.3 py-0.2 h-fit"
								onClick={() => chrome.tabs.create({ url: 'https://platform.openai.com/api-keys' })}
							>
								OpenAI account settings
							</Button>
							. Make sure{' '}
							<Button
								variant="link"
								className="px-0.3 py-0.2 h-fit"
								onClick={() =>
									chrome.tabs.create({
										url: 'https://platform.openai.com/settings/organization/billing/overview',
									})
								}
							>
								billing
							</Button>{' '}
							is enabled.
						</div>
					</div>
				) : settings.selectedTranscriptionService === 'Groq' ? (
					<div className="grid gap-2">
						<SettingsLabelInput
							id="groq-api-key"
							label="Groq API Key"
							value={settings.groqApiKey}
							onChange={(value) =>
								setSettings({
									...settings,
									groqApiKey: value,
								})
							}
							placeholder="Your Groq API Key"
							type="password"
						/>
						<div className="text-muted-foreground text-sm">
							You can find your Groq API key in your{' '}
							<Button
								variant="link"
								className="px-0.3 py-0.2 h-fit"
								onClick={() => chrome.tabs.create({ url: 'https://console.groq.com/keys' })}
							>
								Groq console
							</Button>
							.
						</div>
					</div>
				) : null}
			</CardContent>
			<CardFooter>
				<Button
					onClick={() => {
						if (settings.selectedTranscriptionService === 'OpenAI' && !settings.openAiApiKey) {
							alert('Please enter an OpenAI API Key');
							return;
						}
						if (settings.selectedTranscriptionService === 'Groq' && !settings.groqApiKey) {
							alert('Please enter an Groq API Key');
							return;
						}
						window.close();
					}}
					className="w-full"
					variant="secondary"
				>
					Submit
				</Button>
			</CardFooter>
		</Card>
	);
}

function SettingsLabelSelect<T extends string>({
	id,
	label,
	options,
	value,
	onValueChange,
	placeholder = 'Select an option',
	disabled = false,
}: {
	id: string;
	label: string;
	options: {
		value: string;
		label: string;
	}[];
	value: T;
	onValueChange: (value: T) => void;
	placeholder?: string;
	disabled?: boolean;
}) {
	return (
		<Fragment>
			<Label className="text-sm" htmlFor={id}>
				{label}
			</Label>
			<Select value={value} onValueChange={onValueChange} disabled={disabled}>
				<SelectTrigger id={id} className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Fragment>
	);
}

function SettingsLabelInput({
	id,
	label,
	value,
	onChange,
	placeholder = '',
	type = 'text',
	disabled = false,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: 'text' | 'password';
	disabled?: boolean;
}) {
	return (
		<Fragment>
			<Label className="text-sm" htmlFor={id}>
				{label}
			</Label>
			<Input
				id={id}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				type={type}
				disabled={disabled}
				autoComplete="off"
			/>
		</Fragment>
	);
}

export default IndexPopup;

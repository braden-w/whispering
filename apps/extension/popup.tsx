import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GithubIcon from 'react:./components/icons/github.svg';
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { sendToBackground } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { WHISPERING_URL, type RecorderState } from '@repo/shared';
import { Effect } from 'effect';
import { ClipboardIcon, ListIcon, MoonIcon, SlidersVerticalIcon, SunIcon } from 'lucide-react';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';
import type * as CancelRecording from './background/messages/cancelRecording';
import type * as ToggleRecording from './background/messages/toggleRecording';
import './style.css';

function IndexPopup() {
	return (
		<div className="h-[28rem] w-96">
			<div className="relative flex min-h-screen flex-col">
				<main className="flex flex-1 justify-center p-4">
					<IndexPage />
				</main>
			</div>
		</div>
	);
}

const toggleRecording = () =>
	Effect.tryPromise({
		try: () =>
			sendToBackground<ToggleRecording.RequestBody, ToggleRecording.ResponseBody>({
				name: 'toggleRecording',
			}),
		catch: (error) =>
			new WhisperingError({
				title: `Unable to toggle recording via background service worker`,
				description:
					error instanceof Error
						? error.message
						: 'There was likely an issue sending the message to the background service worker from the popup.',
				error,
			}),
	}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);

const cancelRecording = () =>
	Effect.tryPromise({
		try: () =>
			sendToBackground<CancelRecording.RequestBody, CancelRecording.ResponseBody>({
				name: 'cancelRecording',
			}),
		catch: (error) =>
			new WhisperingError({
				title: `Unable to cancel recording via background service worker`,
				description:
					error instanceof Error
						? error.message
						: 'There was likely an issue sending the message to the background service worker from the popup.',
				error,
			}),
	}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);

const recorderStateToIcons = {
	RECORDING: '🔲',
	LOADING: '🔄',
	IDLE: '🎙️',
} as const satisfies Record<RecorderState, string>;

function IndexPage() {
	const [recorderState] = useStorage<RecorderState>('whispering-recording-state');
	const [latestRecordingTranscribedText] = useStorage<string>(
		'whispering-latest-recording-transcribed-text',
	);

	const recorderStateAsIcon = recorderStateToIcons[recorderState ?? 'IDLE'];
	const copyToClipboardText = (() => {
		if (latestRecordingTranscribedText) return latestRecordingTranscribedText;
		if (recorderState === 'LOADING') return '...';
		return '';
	})();

	return (
		<ThemeProvider defaultTheme="system" storageKey="whispering-theme">
			<div className="flex flex-col items-center justify-center gap-4 text-center">
				<div className="flex flex-col gap-4">
					<h1 className="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">
						Start recording
					</h1>
					<p className="text-muted-foreground">
						Click the <span>🎙</span> button to start. Allow access to your microphone.
					</p>
				</div>
				<div className="relative">
					<Button
						className="transform px-4 py-16 text-8xl hover:scale-110 focus:scale-110"
						onClick={toggleRecording}
						aria-label="Toggle recording"
						variant="ghost"
					>
						<span style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))' }}>
							{recorderStateAsIcon}
						</span>
					</Button>
					{recorderState === 'RECORDING' ?? (
						<Button
							className="absolute -right-16 bottom-1.5 transform text-2xl hover:scale-110 focus:scale-110"
							onClick={cancelRecording}
							aria-label="Cancel recording"
							size="icon"
							variant="ghost"
						>
							🚫
						</Button>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="transcribed-text" className="sr-only">
						Transcribed Text
					</Label>
					<div className="flex items-center gap-2">
						<Input
							id="transcribed-text"
							className="w-64"
							placeholder="Transcribed text will appear here..."
							readOnly
							value={copyToClipboardText}
						/>
						<Button
							className="dark:bg-secondary dark:text-secondary-foreground px-4 py-2"
							onClick={() => {
								navigator.clipboard.writeText(copyToClipboardText);
							}}
						>
							<ClipboardIcon className="h-6 w-6" />
							<span className="sr-only">Copy transcribed text</span>
						</Button>
					</div>
					{/* {#if maybeLatestAudioSrc}
			{@const latestAudioSrc = maybeLatestAudioSrc}
			<audio
				style="view-transition-name: {createRecordingViewTransitionName({
					recordingId: latestRecording.id,
					propertyName: 'blob',
				})}"
				src={latestAudioSrc}
				controls
				className="h-8 w-full"
			/>
		{/if} */}
				</div>
				<div className="flex flex-col items-center justify-center gap-2">
					<NavItems />
					<p className="text-foreground/75 text-sm leading-6">
						Click the microphone or press
						<Button
							aria-label="Keyboard Shortcuts"
							variant="link"
							className="px-0.5"
							onClick={() => {
								chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
							}}
						>
							<kbd className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
								your global keyboard shortcut
							</kbd>
						</Button>{' '}
						to start recording.
					</p>
					<p className="text-muted-foreground text-sm font-light">
						Check out the
						<Button
							asChild
							variant="link"
							className="h-fit px-0.5 py-0"
							title="Check out the desktop app"
							aria-label="Check out the desktop app"
						>
							<a
								href="https://github.com/braden-w/whispering/releases"
								target="_blank"
								rel="noopener noreferrer"
							>
								desktop app
							</a>
						</Button>
						for more integrations!
					</p>
				</div>
			</div>
		</ThemeProvider>
	);
}

function NavItems() {
	const { theme, setTheme } = useTheme();

	return (
		<nav className="flex items-center">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={() => {
								chrome.tabs.create({ url: `${WHISPERING_URL}/recordings` });
							}}
							variant="ghost"
							size="icon"
						>
							<ListIcon className="h-4 w-4" aria-hidden="true" />
							<span className="sr-only">Recordings</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Recordings</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={() => {
								chrome.tabs.create({ url: `${WHISPERING_URL}/settings` });
							}}
							variant="ghost"
							size="icon"
						>
							<SlidersVerticalIcon className="h-4 w-4" aria-hidden="true" />
							<span className="sr-only">Settings</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Settings</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={() => {
								chrome.tabs.create({
									url: 'https://github.com/braden-w/whispering',
								});
							}}
							variant="ghost"
							size="icon"
						>
							<GithubIcon className="h-4 w-4" aria-hidden="true" />
							<span className="sr-only">View project on GitHub</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>View project on GitHub</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={() => {
								setTheme(theme === 'dark' ? 'light' : 'dark');
							}}
							variant="ghost"
							size="icon"
						>
							<SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							<span className="sr-only">Toggle dark mode</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Toggle dark mode</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</nav>
	);
}

export default IndexPopup;

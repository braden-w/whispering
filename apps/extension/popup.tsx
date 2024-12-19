import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';
import { sendToBackground } from '@plasmohq/messaging';

import {
	Ok,
	WHISPERING_RECORDINGS_PATHNAME,
	WhisperingErr,
	recorderStateToIcons,
	tryAsyncWhispering,
} from '@repo/shared';
import {
	ClipboardIcon,
	ListIcon,
	MoonIcon,
	SlidersVerticalIcon,
	SunIcon,
	Loader2Icon,
} from 'lucide-react';
import GithubIcon from 'react:./components/icons/github.svg';
import type * as CancelRecording from '~background/messages/whispering-web/cancelRecording';
import type * as ToggleRecording from '~background/messages/whispering-web/toggleRecording';
import { WhisperingButton } from '~components/WhisperingButton';
import { renderErrorAsNotification } from '~lib/errors';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import {
	useWhisperingRecorderState,
	useWhisperingTranscribedText,
} from '~lib/storage/useWhisperingStorage';
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

const toggleRecording = async () => {
	const sendToToggleRecordingResult = await tryAsyncWhispering({
		try: () =>
			sendToBackground<
				ToggleRecording.RequestBody,
				ToggleRecording.ResponseBody
			>({ name: 'whispering-web/toggleRecording' }),
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to toggle recording via background service worker',
			description:
				'There was likely an issue sending the message to the background service worker from the popup.',
			action: { type: 'more-details', error },
		}),
	});
	if (!sendToToggleRecordingResult.ok) return sendToToggleRecordingResult;
	const toggleRecordingResult = sendToToggleRecordingResult.data;
	if (!toggleRecordingResult.ok) return toggleRecordingResult;
	return Ok(toggleRecordingResult.data);
};

const cancelRecording = async () => {
	const sendToCancelRecordingResult = await tryAsyncWhispering({
		try: () =>
			sendToBackground<
				CancelRecording.RequestBody,
				CancelRecording.ResponseBody
			>({
				name: 'whispering-web/cancelRecording',
			}),
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to cancel recording via background service worker',
			description:
				'There was likely an issue sending the message to the background service worker from the popup.',
			action: { type: 'more-details', error },
		}),
	});
	if (!sendToCancelRecordingResult.ok) return sendToCancelRecordingResult;
	const cancelRecordingResult = sendToCancelRecordingResult.data;
	if (!cancelRecordingResult.ok) return cancelRecordingResult;
	return Ok(cancelRecordingResult.data);
};

function IndexPage() {
	const recorderState = useWhisperingRecorderState();
	const transcribedText = useWhisperingTranscribedText();

	const recorderStateAsIcon = recorderState === 'RECORDING' ? '🔲' : '🎙️';

	const copyToClipboardText = (() => {
		if (recorderState === 'LOADING') return '...';
		if (transcribedText) return transcribedText;
		return '';
	})();

	return (
		<ThemeProvider defaultTheme="system" storageKey="whispering-theme">
			<div className="flex h-[28rem] w-96 flex-col items-center justify-center gap-4 text-center">
				<div className="flex flex-col gap-4">
					<h1 className="scroll-m-20 font-bold text-4xl tracking-tight lg:text-5xl">
						Start recording
					</h1>
					<p className="text-muted-foreground">
						Click the <span>🎙</span> button to start. Allow access to your
						microphone.
					</p>
				</div>
				<div className="relative">
					<WhisperingButton
						tooltipContent="Toggle recording"
						className="h-full w-full transform items-center justify-center overflow-hidden duration-300 ease-in-out hover:scale-110 focus:scale-110"
						onClick={async () => {
							const toggleRecordingResult = await toggleRecording();
							if (!toggleRecordingResult.ok)
								renderErrorAsNotification(toggleRecordingResult);
						}}
						aria-label="Toggle recording"
						variant="ghost"
					>
						<span
							style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))' }}
							className="text-[100px] leading-none"
						>
							{recorderStateAsIcon}
						</span>
					</WhisperingButton>
					{recorderState === 'RECORDING' && (
						<WhisperingButton
							tooltipContent="Cancel recording"
							className="-right-14 absolute bottom-0 transform text-2xl hover:scale-110 focus:scale-110"
							onClick={async () => {
								const cancelRecordingResult = await cancelRecording();
								if (!cancelRecordingResult.ok)
									renderErrorAsNotification(cancelRecordingResult);
							}}
							aria-label="Cancel recording"
							variant="ghost"
						>
							🚫
						</WhisperingButton>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="transcribed-text" className="sr-only">
						Transcribed Text
					</Label>
					<div className="flex w-full max-w-80 items-center gap-2">
						<Input
							id="transcribed-text"
							className="w-full"
							placeholder="Transcribed text will appear here..."
							readOnly
							value={copyToClipboardText}
						/>
						<WhisperingButton
							tooltipContent="Copy transcribed text"
							className="px-4 py-2 dark:bg-secondary dark:text-secondary-foreground"
							onClick={() => {
								navigator.clipboard.writeText(copyToClipboardText);
							}}
						>
							{recorderState === 'LOADING' ? (
								<Loader2Icon className="h-6 w-6 animate-spin" />
							) : (
								<ClipboardIcon className="h-6 w-6" />
							)}
						</WhisperingButton>
					</div>
				</div>
				<div className="flex flex-col items-center justify-center gap-3">
					<NavItems />
					<p className="text-foreground/75 text-sm leading-6">
						Click the microphone or press your configured global{' '}
						<WhisperingButton
							tooltipContent="Keyboard Shortcuts"
							aria-label="Keyboard Shortcuts"
							variant="link"
							className="px-0.5"
							onClick={() => {
								chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
							}}
						>
							<kbd className="relative rounded bg-muted px-[0.3rem] py-[0.15rem] font-mono font-semibold text-sm">
								shortcut
							</kbd>
						</WhisperingButton>{' '}
						to start recording.
					</p>
					<p className="font-light text-muted-foreground text-sm">
						Check out the{' '}
						<WhisperingButton
							tooltipContent="Check out the desktop app"
							variant="link"
							size="inline"
							onClick={() => {
								chrome.tabs.create({
									url: 'https://github.com/braden-w/whispering/releases',
								});
							}}
						>
							desktop app
						</WhisperingButton>{' '}
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
			<WhisperingButton
				tooltipContent="Recordings"
				onClick={async () => {
					const whisperingTabIdResult = await getOrCreateWhisperingTabId();
					if (!whisperingTabIdResult.ok)
						return renderErrorAsNotification(whisperingTabIdResult);
					const whisperingTabId = whisperingTabIdResult.data;
					const tab = await chrome.tabs.get(whisperingTabId);
					if (!tab.url)
						return renderErrorAsNotification(
							WhisperingErr({
								title: 'Whispering tab has no URL',
								description: 'The Whispering tab has no URL.',
							}),
						);
					const url = new URL(tab.url);

					if (url.pathname === WHISPERING_RECORDINGS_PATHNAME) {
						return await chrome.tabs.update(whisperingTabId, {
							active: true,
						});
					}
					url.pathname = WHISPERING_RECORDINGS_PATHNAME;
					await chrome.tabs.update(whisperingTabId, {
						url: url.toString(),
						active: true,
					});
				}}
				variant="ghost"
				size="icon"
			>
				<ListIcon className="h-4 w-4" aria-hidden="true" />
			</WhisperingButton>

			<WhisperingButton
				tooltipContent="Settings"
				onClick={() => chrome.runtime.openOptionsPage()}
				variant="ghost"
				size="icon"
			>
				<SlidersVerticalIcon className="h-4 w-4" aria-hidden="true" />
			</WhisperingButton>

			<WhisperingButton
				tooltipContent="View project on GitHub"
				onClick={() => {
					chrome.tabs.create({ url: 'https://github.com/braden-w/whispering' });
				}}
				variant="ghost"
				size="icon"
			>
				<GithubIcon
					className="h-4 w-4 fill-current text-foreground"
					aria-hidden="true"
				/>
			</WhisperingButton>
			<WhisperingButton
				className="relative"
				tooltipContent="Toggle dark mode"
				onClick={() => {
					setTheme(theme === 'dark' ? 'light' : 'dark');
				}}
				variant="ghost"
				size="icon"
			>
				<SunIcon className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
				<MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			</WhisperingButton>
		</nav>
	);
}

export default IndexPopup;

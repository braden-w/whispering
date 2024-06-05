import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStorage } from '@plasmohq/storage/hook';
import { Effect } from 'effect';
import type { RecorderState } from '~lib/services/RecorderService';
import './style.css';
import { commands } from '~lib/utils/commands';

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
const toggleRecording = () => commands.toggleRecording.invokeFromPopup().pipe(Effect.runPromise);
const cancelRecording = () => commands.cancelRecording.invokeFromPopup().pipe(Effect.runPromise);

function IndexPage() {
	const [recorderState] = useStorage<RecorderState>('whispering-recording-state');
	return (
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
						{recorderState === 'RECORDING' ? '🔲' : '🎙️'}
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
						// value={
						// 	latestRecording.transcriptionStatus === 'TRANSCRIBING'
						// 		? '...'
						// 		: latestRecording.transcribedText
						// }
					/>
					<Button
						className="dark:bg-secondary dark:text-secondary-foreground px-4 py-2"
						// onClick={copyRecordingTextFromLatestRecording}
					>
						{/* <ClipboardIcon /> */}
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
				{/* <NavItems /> */}
				<p className="text-foreground/75 text-sm leading-6">
					Click the microphone or press
					<Button aria-label="Keyboard Shortcuts" variant="link" className="px-0.5">
						<a href="/shortcut">
							<kbd className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
								space
							</kbd>
						</a>
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
							app
						</a>
					</Button>
					for more integrations!
				</p>
			</div>
		</div>
	);
}

// export default IndexPopup;

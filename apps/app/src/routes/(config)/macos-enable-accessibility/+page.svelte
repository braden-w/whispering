<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { SettingsIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { invoke } from '@tauri-apps/api/tauri';
</script>

<svelte:head>
	<title>MacOS Accessibility</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center">
	<Card.Root class="w-full max-w-2xl">
		<Card.Header>
			<Card.Title class="text-xl">MacOS Accessibility</Card.Title>
			<Card.Description>
				Follow the steps below to re-enable Whispering in your MacOS Accessibility settings. This
				often is needed after installing a new version of Whispering to get pasting to work, as
				detailed in this this <Button
					variant="link"
					size="inline"
					href="https://github.com/enigo-rs/enigo/issues/174"
					target="_blank"
					rel="noopener noreferrer">Github issue</Button
				>.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col items-center gap-2">
				<video
					class="max-w-md"
					src="https://github.com/braden-w/whispering/raw/feat/add-accessibility-troubleshooting/images/macos_enable_accessibility.mp4"
					autoplay
					loop
					controls
				></video>
				<ol class="text-muted-foreground max-w-2xl list-inside list-decimal space-y-2 text-left">
					<li>
						Go to <span class="text-primary font-semibold tracking-tight">
							System Preferences > Privacy & Security > Accessibility
						</span> or use the button below.
					</li>

					<li>
						Click on <span class="text-primary font-semibold tracking-tight">🎙️ Whispering</span> and
						remove it using the minus icon (-).
					</li>
					<li>
						Re-add Whispering by pressing the plus icon (+) and selecting <span
							class="text-primary font-semibold tracking-tight">🎙️ Whispering.app</span
						>
					</li>
				</ol>
			</div>
		</Card.Content>
		<Card.Footer>
			<Button onclick={() => invoke('open_apple_accessibility')} variant="default" class="w-full">
				<SettingsIcon class="mr-2 h-6 w-6" />
				Open MacOS Accessibility Settings
			</Button>
		</Card.Footer>
	</Card.Root>
</main>

<script lang="ts">
	import { SettingsIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { invoke } from '@tauri-apps/api/tauri';
</script>

<svelte:head>
	<title>MacOS Accessibility</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center">
	<section class="container flex max-w-4xl flex-col items-center gap-4 text-center">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">MacOS Accessibility</h1>
		<p class="text-muted-foreground max-w-2xl text-left lg:text-xl">
			Follow the steps below to re-enable Whispering in your MacOS Accessibility settings. This
			often is needed after installing a new version of Whispering to get pasting to work, as
			detailed in this this <Button
				variant="link"
				size="inline"
				href="https://github.com/enigo-rs/enigo/issues/174"
				target="_blank"
				rel="noopener noreferrer">Github issue</Button
			>.
		</p>
		<div class="flex flex-col items-center gap-2">
			<video
				class="max-w-md"
				src="https://github.com/braden-w/whispering/raw/feat/add-accessibility-troubleshooting/images/macos_enable_accessibility.mp4"
				autoplay
				loop
				controls
			></video>
			<ol
				class="text-muted-foreground max-w-2xl list-inside list-decimal space-y-2 text-left lg:text-xl"
			>
				<li>
					Go to <span
						class="text-primary whitespace-normal px-1 text-base font-semibold tracking-normal lg:text-xl"
					>
						System Preferences > Privacy & Security > Accessibility
					</span> or use the button below.
				</li>

				<li>
					Click on <span class="text-primary font-semibold tracking-tight">🎙️ Whispering</span> and remove
					it using the minus icon (-).
				</li>
				<li>
					Re-add Whispering by pressing the plus icon (+) and selecting <span
						class="text-primary font-semibold tracking-tight">🎙️ Whispering.app</span
					>
				</li>
			</ol>
			<Button onclick={() => invoke('open_apple_accessibility')} variant="default" class="w-full">
				<SettingsIcon class="mr-2 h-6 w-6" />
				Open MacOS Accessibility Settings
			</Button>
		</div>
	</section>
</main>

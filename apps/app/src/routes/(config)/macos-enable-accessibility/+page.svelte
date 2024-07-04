<script lang="ts">
	import { SettingsIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { invoke } from '@tauri-apps/api/tauri';
</script>

<svelte:head>
	<title>MacOS Accessibility</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center">
	<section class="container flex flex-col items-center gap-4 text-center">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">MacOS Accessibility</h1>
		<p class="text-muted-foreground lg:text-xl">
			Follow the steps below to re-enable Whispering in your MacOS Accessibility settings.
		</p>
		<div class="flex max-w-2xl flex-col gap-2">
			<video
				src="https://github.com/braden-w/whispering/raw/feat/add-accessibility-troubleshooting/images/macos_enable_accessibility.mp4"
				autoplay
				loop
				controls
			></video>

			<ol class="text-muted-foreground list-inside list-decimal space-y-2 text-left lg:text-xl">
				<li>
					Go to
					<span
						class="text-primary whitespace-normal px-1 text-base font-semibold tracking-normal lg:text-xl"
					>
						System Preferences > Privacy & Security > Accessibility
					</span>
				</li>
				<Button onclick={() => invoke('open_apple_accessibility')} variant="default" size="lg">
					<SettingsIcon class="mr-2 h-6 w-6" />
					Open MacOS Accessibility
				</Button>
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
		</div>
		<Button onclick={() => window.history.back()} variant="link">Go back</Button>
	</section>
</main>

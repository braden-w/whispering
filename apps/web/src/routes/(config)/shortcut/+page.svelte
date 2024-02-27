<script lang="ts">
	import { Button } from '@repo/ui/components/button';
	import ChromeWebstoreIcon from '~icons/logos/chrome-web-store';
	import DesktopIcon from '~icons/lucide/laptop';
</script>

<svelte:head>
	<title>Change Keyboard Shortcut</title>
</svelte:head>

<div class="flex items-center justify-center">
	<section class="container flex flex-col items-center gap-4 text-center">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
			Change Your Keyboard Shortcut
		</h1>
		<p class="text-muted-foreground lg:text-xl">
			You can access global keyboard shortcuts on the extension and desktop app.
		</p>
		<div class="flex flex-col gap-2 md:flex-row">
			<Button
				size="lg"
				variant="default"
				href="https://github.com/braden-w/whispering/releases"
				target="_blank"
				rel="noopener noreferrer"
				title="Check out the Chrome Extension"
				aria-label="Check out the Chrome Extension"
			>
				<DesktopIcon class="mr-2 h-6 w-6" />
				Download for Desktop
			</Button>
			<Button
				size="lg"
				variant="outline"
				href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo?hl=en&authuser=0"
				target="_blank"
				rel="noopener noreferrer"
				title="Check out the desktop app"
				aria-label="Check out the desktop app"
			>
				<ChromeWebstoreIcon class="mr-2 h-6 w-6" />
				Get Chrome Extension
			</Button>
		</div>
		<Button href="/" variant="link">Go back</Button>
	</section>
</div>

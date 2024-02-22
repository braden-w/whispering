<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '@repo/ui/components/card';
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { options } from '$lib/stores/options';
	import { registerShortcut } from '$lib/system-apis/shortcuts';
	import { toast } from '@repo/ui/components/sonner';
	import { Button } from '@repo/ui/components/button';
	import { Input } from '@repo/ui/components/input';

	async function onChangeShortcutClick() {
		await toast.promise(registerShortcut($options.currentGlobalShortcut, toggleRecording), {
			loading: 'Registering shortcuts...',
			success: 'Registered shortcuts!',
			error: "Couldn't register shortcut. The shortcut code must be a valid keyboard shortcut."
		});
		goto('/');
	}
</script>

<div class="flex min-h-screen items-center justify-center">
	<section>
		<div class="container flex flex-col items-center gap-4 px-4 text-center md:px-6">
			<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
				Change Your Keyboard Shortcut
			</h1>
			<p class="text-muted-foreground text-xl">
				You can access keyboard shortcuts on the extension and desktop app.
			</p>

			<div class="flex flex-col gap-2 md:flex-row">
				<Button size="lg" variant="default" href="https://github.com/braden-w/whispering/releases">
					Download for Desktop
				</Button>
				<Button
					size="lg"
					variant="outline"
					href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo?hl=en&authuser=0"
				>
					Get Chrome Extension
				</Button>
			</div>
			<Button href="/" variant="link">Go back</Button>
		</div>
	</section>
</div>

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
				<a
					class="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
					href="#"
				>
					Download for Desktop
				</a>
				<a
					class="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
					href="#"
				>
					Get Chrome Extension
				</a>
			</div>
			<Button href="/" variant="link">Go back</Button>
		</div>
	</section>
</div>

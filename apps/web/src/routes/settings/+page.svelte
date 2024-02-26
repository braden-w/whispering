<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { Button } from '@repo/ui/components/button';
	import * as Card from '@repo/ui/components/card';
	import { Checkbox } from '@repo/ui/components/checkbox';
	import { Label } from '@repo/ui/components/label';
</script>

<div class="container flex min-h-screen items-center justify-center">
	<Card.Root class="max-w-sm">
		<Card.Header>
			<Card.Title tag="h1">Settings</Card.Title>
			<Card.Description>Customize your Whispering experience</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex gap-2">
				<Checkbox
					bind:checked={$settings.copyToClipboard}
					id="copy-to-clipboard"
					aria-labelledby="copy-to-clipboard-label"
				/>
				<Label
					id="copy-to-clipboard-label"
					for="copy-to-clipboard"
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Copy text to clipboard on successful transcription
				</Label>
			</div>
			<div class="flex gap-2">
				<Checkbox bind:checked={$settings.pasteContentsOnSuccess} id="paste-contents-on-success" />
				<Label
					for="paste-contents-on-success"
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Paste contents from clipboard after successful transcription (experimental)
				</Label>
			</div>
			<Button href="/" variant="link">Go back</Button>
			<Button href="/key" variant="link">Edit key</Button>
		</Card.Content>
	</Card.Root>
</div>

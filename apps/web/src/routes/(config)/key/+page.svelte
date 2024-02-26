<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import { Button } from '@repo/ui/components/button';
	import * as Card from '@repo/ui/components/card';
	import { Input } from '@repo/ui/components/input';
	import { toast } from '@repo/ui/components/sonner';
	import PaperAirplaneIcon from '~icons/heroicons/paper-airplane';

	function submitApiKey() {
		if (!$apiKey) {
			toast.error('Please enter a valid OpenAI API key.');
		} else {
			toast.success('API key set!');
			goto('/');
		}
	}
</script>

<div class="container flex min-h-screen items-center justify-center">
	<Card.Root class="max-w-sm">
		<Card.Header>
			<Card.Title tag="h1">Enter OpenAI API Key</Card.Title>
			<Card.Description>
				You can find your OpenAPI key
				<Button
					href="https://platform.openai.com/api-keys"
					target="_blank"
					rel="noopener noreferrer"
					variant="link"
					class="px-0"
				>
					here.
				</Button>
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<form class="flex gap-2" on:submit|preventDefault={submitApiKey}>
				<Input
					class="w-64"
					placeholder="Your OpenAI API Key"
					bind:value={$apiKey}
					type="text"
					autocomplete="off"
				/>
				<Button type="submit">
					<PaperAirplaneIcon />
				</Button>
			</form>
			<Button href="/" variant="secondary">Go back</Button>
		</Card.Content>
	</Card.Root>
</div>

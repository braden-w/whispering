<script lang="ts">
	import { PMCommand } from '@repo/ui/pm-command';
</script>

<svelte:head>
	<title>epicenter.sh - Web Interface for Self-Hosted AI Coding</title>
	<meta
		name="description"
		content="Connect to OpenCode servers from your browser. Run fully local or tunnel through ngrok. Your code stays on your machine, even with cloud deployment."
	/>
</svelte:head>

<div
	class="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 sm:px-6 max-w-2xl mx-auto"
>
	<h1 class="text-5xl font-bold tracking-tight mb-4">
		Welcome to epicenter.sh
	</h1>
	<p class="text-muted-foreground mb-8 text-center">
		Get started by running this command in your terminal:
	</p>

	<div class="w-full mb-8">
		<PMCommand
			command="execute"
			args={['@epicenter/cli@latest', 'sh']}
			agent="bun"
			agents={['bun']}
		/>
	</div>

	<p class="text-sm text-muted-foreground text-center">
		This will start your OpenCode server and open epicenter.sh with your
		assistant pre-configured.
	</p>
	
	<p class="text-sm text-muted-foreground text-center">
		<a href="/faq" class="underline underline-offset-4">Learn how it works</a> under the hood.
	</p>
</div>

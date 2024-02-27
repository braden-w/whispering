<script lang="ts">
	import type { Recording } from '@repo/recorder/services/recordings-db';
	import * as Tooltip from '@repo/ui/components/tooltip';
	import RepeatIcon from '~icons/lucide/repeat';
	import PlayIcon from '~icons/heroicons/play';
	import ProcessedIcon from '~icons/heroicons/check-circle';

	export let state: Recording['state'];
</script>

{#if state === 'UNPROCESSED'}
	<Tooltip.Root>
		<Tooltip.Trigger>️<PlayIcon /></Tooltip.Trigger>
		<Tooltip.Content>
			<p>Recording has not been processed. Press the <RepeatIcon /> icon to transcribe it.</p>
		</Tooltip.Content>
	</Tooltip.Root>
{:else if state === 'TRANSCRIBING'}
	<Tooltip.Root>
		<Tooltip.Trigger><RepeatIcon /></Tooltip.Trigger>
		<Tooltip.Content>
			<p>Transcribing</p>
		</Tooltip.Content>
	</Tooltip.Root>
{:else if state === 'DONE'}
	<Tooltip.Root>
		<Tooltip.Trigger>
			<ProcessedIcon />
		</Tooltip.Trigger>
		<Tooltip.Content>Recording is done transcribing</Tooltip.Content>
	</Tooltip.Root>
{/if}

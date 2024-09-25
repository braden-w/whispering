<script lang="ts">
const {
	recordingId,
	transcribedText,
}: { recordingId: string; transcribedText: string } = $props();
</script>

<p
	class="max-h-12 overflow-y-auto"
	style="view-transition-name: {createRecordingViewTransitionName({
		recordingId: recordingId,
		propertyName: 'transcribedText',
	})}"
>
	{transcribedText}
</p>

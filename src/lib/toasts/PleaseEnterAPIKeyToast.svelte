<script lang="ts">
	function openOptionsPage() {
		chrome.runtime.openOptionsPage();
	}
</script>

<span>
	First, please enter your OpenAI API key in <button
		on:click={openOptionsPage}
		class="text-gray-600 underline hover:text-indigo-900">
		the settings.
	</button>
</span>

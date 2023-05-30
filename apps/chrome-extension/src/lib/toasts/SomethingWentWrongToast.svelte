<script lang="ts">
	function openOptionsPage() {
		chrome.runtime.openOptionsPage();
	}
</script>

<span>
	Something went wrong. Please verify that your <button
		on:click={openOptionsPage}
		class="text-gray-600 underline hover:text-indigo-900"
	>
		API Key in settings
	</button> is correct.
</span>

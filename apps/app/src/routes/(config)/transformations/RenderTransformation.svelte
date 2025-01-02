<script lang="ts">
	import type { Transformation } from '$lib/services/db';
	import {
		SettingsLabelInput,
		SettingsLabelSelect,
		SettingsLabelSwitch,
	} from '$lib/components/labeled-input/index.js';

	let { initialTransformation }: { initialTransformation: Transformation } =
		$props();
	let transformation = $state(structuredClone(initialTransformation));

	$effect(() => {
		transformation = structuredClone(initialTransformation);
	});
</script>

<SettingsLabelInput
	id="title"
	label="Title"
	bind:value={transformation.title}
	placeholder="Enter a title"
/>

<SettingsLabelInput
	id="description"
	label="Description"
	bind:value={transformation.description}
	placeholder="Enter a description"
/>

{#each transformation.steps as step}
	<SettingsLabelSelect
		id="step-type"
		label="Step Type"
		selected={step.type}
		items={[
			{ value: 'prompt_transform', label: 'Prompt Transform' },
			{ value: 'find_replace', label: 'Find Replace' },
		]}
		onSelectedChange={(value) => {
			step.type = value;
		}}
		placeholder="Select a step type"
	/>
	{#if step.type === 'find_replace'}
		<SettingsLabelInput
			id="find_replace.findText"
			label="Find Text"
			bind:value={step['find_replace.findText']}
			placeholder="Enter a find text"
		/>
		<SettingsLabelInput
			id="find_replace.replaceText"
			label="Replace Text"
			bind:value={step['find_replace.replaceText']}
			placeholder="Enter a replace text"
		/>
		<SettingsLabelSwitch
			id="find_replace.useRegex"
			label="Use Regex"
			checked={step['find_replace.useRegex']}
			onCheckedChange={(v) => {
				step['find_replace.useRegex'] = v;
			}}
		/>
	{:else if step.type === 'prompt_transform'}
		<SettingsLabelSelect
			id="prompt_transform.model"
			label="Model"
			items={[
				{ value: 'gpt-4o', label: 'GPT-4o' },
				{ value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
			]}
			selected={step['prompt_transform.model']}
			placeholder="Select a model"
			onSelectedChange={(value) => {
				step['prompt_transform.model'] = value;
			}}
		/>
		<SettingsLabelInput
			id="prompt_transform.systemPromptTemplate"
			label="System Prompt Template"
			bind:value={step['prompt_transform.systemPromptTemplate']}
			placeholder="Enter a system prompt template"
		/>
		<SettingsLabelInput
			id="prompt_transform.userPromptTemplate"
			label="User Prompt Template"
			bind:value={step['prompt_transform.userPromptTemplate']}
			placeholder="Enter a user prompt template"
		/>
	{/if}
{/each}

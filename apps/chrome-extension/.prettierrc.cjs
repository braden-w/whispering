/**
 * @type {import('prettier').Options}
 */
module.exports = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	bracketSpacing: true,
	bracketSameLine: true,
	plugins: ['prettier-plugin-svelte', require.resolve('@plasmohq/prettier-plugin-sort-imports')],
	importOrder: ['^@plasmohq/(.*)$', '^~(.*)$', '^[./]'],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	pluginSearchDirs: ['.'],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }]
};

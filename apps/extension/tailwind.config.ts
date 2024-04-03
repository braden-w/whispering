import base from '@repo/ui/tailwind.config';
import type { Config } from 'tailwindcss';

const config = {
	presets: [base],
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'../../packages/ui/src/lib/components/**/*.{svelte,ts}'
	]
} satisfies Config;

export default config;
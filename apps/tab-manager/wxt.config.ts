import { defineConfig } from 'wxt';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	modules: ['@wxt-dev/module-svelte'],
	vite: () => ({
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				$lib: path.resolve('./src/lib'),
			},
		},
	}),
});

import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-svelte'],
	srcDir: 'src',
	vite: () => ({
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				$lib: path.resolve('./src/lib'),
			},
		},
	}),
});

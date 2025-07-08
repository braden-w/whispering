import { defineConfig } from 'wxt';
import path from 'node:path';

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	modules: ['@wxt-dev/module-svelte'],
	vite: () => ({
		resolve: {
			alias: {
				$lib: path.resolve('./src/lib'),
			},
		},
	}),
});

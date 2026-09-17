import antfu from '@antfu/eslint-config';

export default antfu({
	stylistic: {
		indent: 'tab',
		quotes: 'single',
		semi: true,
	},

	typescript: true,

	ignores: [
		'build/dist/',
		'coverage/',
		'dist/',
		'node_modules/',
		'.eslintcache',
		'debug.log',
		// Markdown docs contain illustrative code blocks (some intentionally
		// abbreviated) that are not real source and shouldn't be linted.
		'docs/',
		// Generated / vendored artifacts.
		'package-lock.json',
		// Third-party DWG parser runtime, copied verbatim by scripts/sync-vendor.mjs.
		'vendor/',
	],

	rules: {
		'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
	},
});

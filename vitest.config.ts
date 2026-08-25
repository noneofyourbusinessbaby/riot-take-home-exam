import { defineConfig } from "vitest/config";

// Route tests import the configured app, so load its fixture secret before the
// test workers start. A developer's `.env` must not affect the suite.
process.loadEnvFile(".env.test");

export default defineConfig({
	test: {
		environment: "node",
		// Unit tests sit next to the file they test; `tests` holds the end to end
		// suite, which exercises the assembled application.
		include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
	},
});

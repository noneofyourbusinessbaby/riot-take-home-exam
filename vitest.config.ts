import { defineConfig } from "vitest/config";

// The suite runs against its own `.env.test`, never a developer's `.env`. Vitest
// has no `--env-file` flag and only exposes `VITE_`-prefixed variables, so Node
// loads the file here, before the test processes are forked. A missing file
// throws, which beats running against whatever was in the environment.
// @see https://nodejs.org/api/process.html#processloadenvfilepath
process.loadEnvFile(".env.test");

export default defineConfig({
	test: {
		environment: "node",
		// Unit tests sit next to the file they test; `tests` holds the end to end
		// suite, which exercises the assembled application.
		include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
	},
});

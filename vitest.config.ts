import { defineConfig } from "vitest/config";

// The tests run against the same secret as the server, so they need the same
// `.env`. Vite only ever exposes `VITE_`-prefixed variables to a test, and it is
// Node — not Vitest — that reads `.env` files, through the `--env-file` flag the
// `dev` and `start` scripts pass. Vitest has no such flag, so the config asks
// Node for the same thing directly, before the test processes are forked from it.
// @see https://nodejs.org/api/process.html#processloadenvfilepath
process.loadEnvFile();

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});

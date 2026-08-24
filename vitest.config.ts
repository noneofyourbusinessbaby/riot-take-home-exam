import { defineConfig } from "vitest/config";

// The suite has an environment of its own, `.env.test`, so what it sees does not
// depend on whether a developer has a `.env` or what they put in it. Vite only
// ever exposes `VITE_`-prefixed variables to a test and Vitest loads no `.env`
// file of its own — a variable declared there and read nowhere else does not
// reach `process.env` — so the file is loaded explicitly. It is Node that reads
// it, as it does for the `dev` and `start` scripts through their `--env-file`
// flag; Vitest has no such flag, so the config asks Node directly, before the
// test processes are forked from it. A missing file throws here, which is the
// intended failure: the alternative is a suite that runs against whatever
// happened to be in the environment.
// @see https://nodejs.org/api/process.html#processloadenvfilepath
process.loadEnvFile(".env.test");

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});

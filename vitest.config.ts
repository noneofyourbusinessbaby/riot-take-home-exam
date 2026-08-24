import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		// Unit tests sit next to the file they test; `tests` holds the end to end
		// suite, which exercises the assembled application.
		include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
	},
});

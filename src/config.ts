import { z } from "zod";

/**
 * Everything the process needs from its environment, declared the way the routes
 * declare what they accept: as a schema. The environment is input from outside
 * the program like a request body is, so it is validated rather than tested by
 * hand — the schema states each constraint in one place, gives back a typed
 * object instead of `string | undefined`, and reports every missing variable at
 * once rather than the first one that happens to be read.
 */
const ConfigSchema = z.object({
	// The key the signatures are derived from. `min(1)` and not a bare `string()`
	// because a variable left empty in a `.env` file (`SIGNING_SECRET=`) arrives as
	// the empty string rather than as undefined, and an empty key is no key.
	SIGNING_SECRET: z.string().min(1),

	// The port the server listens on. It carries a default where the secret
	// deliberately carries none: it is not confidential, so a value in the
	// repository gives nothing away, and every environment that has an opinion —
	// a container published on another port, a platform injecting `PORT` — states
	// it. Coerced because the environment only ever hands over strings, and bounded
	// because `PORT=0` asks the kernel for a random port and `PORT=99999` is not a
	// port at all; both are worth failing at boot rather than at the first request
	// nobody could address.
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

const parsed = ConfigSchema.safeParse(process.env);

// Parsed at module load, so a misconfigured deployment fails to start instead of
// failing on the first request that needed the variable. There is deliberately no
// fallback anywhere in the schema: a default committed to the repository would
// let anyone reading it forge signatures against an instance that forgot to set
// the variable, and it would fail silently.
if (!parsed.success) {
	throw Error(
		`The environment is missing required variables. Copy .env.example to .env, or provide them in the environment.\n${z.prettifyError(parsed.error)}`,
	);
}

/** The validated configuration, the only place the rest of the code reads it from. */
export const config = parsed.data;

import { z } from "zod";

/**
 * The environment is input from outside the program like a request body is, so
 * it is validated the same way: one schema, a typed object, and every missing
 * variable reported at once.
 */
const ConfigSchema = z.object({
	// `min(1)` and not a bare `string()`: an empty line in a `.env` file
	// (`SIGNING_SECRET=`) arrives as the empty string, and an empty key is no key.
	SIGNING_SECRET: z.string().min(1),

	// A default is safe here where it would not be for a secret: a port gives
	// nothing away. Coerced because the environment only hands over strings, and
	// bounded because `PORT=0` asks for a random port and `PORT=99999` is not one.
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

const parsed = ConfigSchema.safeParse(process.env);

// Parsed at module load, so a misconfigured deployment fails to start instead of
// on the first request that needed the variable. No fallback for the secret: a
// default committed here would let anyone forge signatures against an instance
// that forgot to set it.
if (!parsed.success) {
	throw Error(
		`The environment is missing required variables. Copy .env.example to .env, or provide them in the environment.\n${z.prettifyError(parsed.error)}`,
	);
}

export const config = parsed.data;

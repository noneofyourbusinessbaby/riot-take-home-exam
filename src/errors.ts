import { type Hook, z } from "@hono/zod-openapi";
import type { Env, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Both handlers below answer with the body `ErrorSchema` documents, so that a
 * client only ever has one error shape to read.
 */

/**
 * What every route does with a request that does not match its schema: the 400
 * it declares, rather than the shape the library reports by default. Passed to
 * each OpenAPIHono instance since the hook is chosen at registration time.
 * @see https://github.com/honojs/middleware/tree/main/packages/zod-openapi#a-dry-approach-to-handling-validation-errors
 */
export const defaultHook: Hook<unknown, Env, string, unknown> = (result, c) => {
	if (!result.success) {
		return c.json({ error: z.prettifyError(result.error) }, 400);
	}
};

/**
 * A body that is not JSON at all never reaches validation: Hono's validator
 * throws an HTTPException before it, so this is what turns a malformed body into
 * the documented 400 — and any unexpected failure into a 500 that says nothing
 * of the internals.
 * @see https://hono.dev/docs/api/exception
 */
export const errorHandler: ErrorHandler = (error, c) => {
	if (error instanceof HTTPException) {
		return c.json({ error: error.message }, error.status);
	}

	console.error(error);
	return c.json({ error: "Internal server error" }, 500);
};

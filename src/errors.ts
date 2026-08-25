import { type Hook, z } from "@hono/zod-openapi";
import type { Env, ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Answers a request that does not match its schema with the 400 the route
 * declares, rather than the library's default shape. Passed to each OpenAPIHono
 * instance, since the hook is chosen at registration time.
 * @see https://github.com/honojs/middleware/tree/main/packages/zod-openapi#a-dry-approach-to-handling-validation-errors
 */
export const defaultHook: Hook<unknown, Env, string, unknown> = (result, c) => {
	if (!result.success) {
		return c.json({ error: z.prettifyError(result.error) }, 400);
	}
};

/**
 * A body that is not JSON never reaches validation: Hono's validator throws an
 * HTTPException first. This turns it into the documented 400, and any unexpected
 * failure into a 500 that says nothing of the internals.
 * @see https://hono.dev/docs/api/exception
 */
export const errorHandler: ErrorHandler = (error, c) => {
	if (!(error instanceof HTTPException) || error.status >= 500) {
		console.error(
			{
				requestId: c.get("requestId"),
				method: c.req.method,
				path: c.req.path,
			},
			error,
		);
	}

	if (error instanceof HTTPException) {
		return c.json({ error: error.message }, error.status);
	}

	return c.json({ error: "Internal server error" }, 500);
};

export const notFoundHandler: NotFoundHandler = (c) =>
	c.json({ error: "Not found" }, 404);

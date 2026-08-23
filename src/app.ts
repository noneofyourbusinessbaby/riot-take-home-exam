import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { encryptionRoutes } from "./routes/encryption.js";
import { signingRoutes } from "./routes/signing.js";

/**
 * The routes are registered by chaining, as the type of the application is only
 * carried through the chain: it is what types the RPC and test clients.
 */
export const app = new OpenAPIHono()
	.route("/", encryptionRoutes)
	.route("/", signingRoutes)
	.doc("/doc", {
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Riot take home exercise",
		},
	})
	.get("/ui", swaggerUI({ url: "/doc" }))
	.get("/health", (c) => c.text("OK"));

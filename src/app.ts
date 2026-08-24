import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { config } from "./config.js";

import { errorHandler } from "./errors.js";

import { base64 } from "./modules/encryption/cipher.base64.js";
import { encryptionRoutes } from "./modules/encryption/routes.js";
import { createEncryptionService } from "./modules/encryption/service.js";
import { signingRoutes } from "./modules/signing/routes.js";
import { createSigningService } from "./modules/signing/service.js";
import { hmacSha256 } from "./modules/signing/signer.hmac-sha256.js";

/**
 * The composition root, and the only place in the codebase where an algorithm is
 * named: the two lines below plug an adapter into each driven port, and swapping
 * base64 for AES or HMAC for Ed25519 is one of them changing. Within a module,
 * `routes.ts` and `service.ts` see an interface instead.
 *
 * The secret is read here rather than by the adapter, so that HMAC stays a pure
 * function of the key it is handed and nothing but this file knows where a key
 * comes from.
 */
const cipher = base64;
const signer = hmacSha256(config.SIGNING_SECRET);

/**
 * The routes are registered by chaining, as the type of the application is only
 * carried through the chain: it is what types the RPC and test clients.
 */
export const app = new OpenAPIHono()
	.route("/", encryptionRoutes(createEncryptionService(cipher)))
	.route("/", signingRoutes(createSigningService(signer)))
	.doc("/doc", {
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Riot take home exercise",
		},
	})
	.get("/ui", swaggerUI({ url: "/doc" }))
	.get("/health", (c) => c.text("OK"))
	// Last in the chain: onError gives back a Hono, not an OpenAPIHono, so .doc()
	// has to have been called by then.
	.onError(errorHandler);

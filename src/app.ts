import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { config } from "./config.js";

import { errorHandler, notFoundHandler } from "./errors.js";

import { Base64Cipher } from "./modules/encryption/cipher.base64.js";
import { encryptionRoutes } from "./modules/encryption/routes.js";
import { EncryptionService } from "./modules/encryption/service.js";
import { signingRoutes } from "./modules/signing/routes.js";
import { SigningService } from "./modules/signing/service.js";
import { HmacSha256Signer } from "./modules/signing/signer.hmac-sha256.js";

const cipher = new Base64Cipher();
const signer = new HmacSha256Signer(config.SIGNING_SECRET);

const application = new OpenAPIHono();
application.use(requestId());
application.use(logger());
application.use(secureHeaders());

// Registered by chaining: the application type only flows through the chain, and
// it is what types the RPC and test clients.
export const app = application
	.route("/", encryptionRoutes(new EncryptionService(cipher)))
	.route("/", signingRoutes(new SigningService(signer)))
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
	// has to come first.
	.notFound(notFoundHandler)
	.onError(errorHandler);

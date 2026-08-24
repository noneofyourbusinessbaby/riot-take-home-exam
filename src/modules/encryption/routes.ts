import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { defaultHook } from "../../errors.js";
import { ErrorSchema, JsonObjectSchema } from "../../schemas.js";
import type { EncryptionService } from "./service.js";

// Unknown rather than string: a payload sent to /decrypt can be partially
// encrypted, and a property that never went through /encrypt keeps its own JSON
// type.
const EncryptedPayloadSchema = z
	.record(z.string(), z.unknown())
	.openapi("EncryptedPayload", {
		example: {
			name: "some_encrypted_value==",
			age: "some_encrypted_value=",
			contact: "some_encrypted_value",
		},
	});

const encryptRoute = createRoute({
	method: "post",
	path: "/encrypt",
	tags: ["Encryption"],
	summary: "Encrypt every depth-1 property of a JSON payload",
	description:
		"Encrypts the value of each property at depth 1. Nested objects and arrays are encrypted as a whole, so the response is always a flat object of strings.",
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: JsonObjectSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Payload with every depth-1 property encrypted",
			content: {
				"application/json": { schema: EncryptedPayloadSchema },
			},
		},
		400: {
			description: "The request body is not a JSON object",
			content: {
				"application/json": { schema: ErrorSchema },
			},
		},
	},
});

const decryptRoute = createRoute({
	method: "post",
	path: "/decrypt",
	tags: ["Encryption"],
	summary: "Decrypt the encrypted depth-1 properties of a JSON payload",
	description:
		"Detects which depth-1 properties hold an encrypted value and decrypts them, restoring their original JSON type. A payload may be partially encrypted: properties that were never encrypted are returned unchanged, whatever their JSON type.",
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: EncryptedPayloadSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Payload with every encrypted depth-1 property decrypted",
			content: {
				"application/json": { schema: JsonObjectSchema },
			},
		},
		400: {
			description: "The request body is not a JSON object",
			content: {
				"application/json": { schema: ErrorSchema },
			},
		},
	},
});

export const encryptionRoutes = (service: EncryptionService) =>
	new OpenAPIHono({ defaultHook })
		.openapi(encryptRoute, (c) =>
			c.json(service.encryptPayload(c.req.valid("json")), 200),
		)
		.openapi(decryptRoute, (c) =>
			c.json(service.decryptPayload(c.req.valid("json")), 200),
		);

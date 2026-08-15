import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { ErrorSchema, JsonObjectSchema } from "../schemas/common.js";

/** Every depth-1 property is replaced by its encrypted string representation. */
const EncryptedPayloadSchema = z
	.record(z.string(), z.string())
	.openapi("EncryptedPayload", {
		example: {
			name: "IkpvaG4gRG9lIg==",
			age: "MzA=",
			contact:
				"eyJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJwaG9uZSI6IjEyMy00NTYtNzg5MCJ9",
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
		"Detects which depth-1 properties hold an encrypted value and decrypts them, restoring their original JSON type. Properties that were never encrypted are returned unchanged.",
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

export const encryptionRoutes = new OpenAPIHono()
	.openapi(encryptRoute, () => {
		throw new HTTPException(501, { message: "Not implemented" });
	})
	.openapi(decryptRoute, () => {
		throw new HTTPException(501, { message: "Not implemented" });
	});

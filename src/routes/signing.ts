import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { ErrorSchema, JsonObjectSchema } from "../schemas/common.js";

const SignatureSchema = z.string().openapi({
	example: "a1b2c3d4e5f6g7h8i9j0",
});

const SignResponseSchema = z
	.object({
		signature: SignatureSchema,
	})
	.openapi("SignResponse");

const VerifyRequestSchema = z
	.object({
		signature: SignatureSchema,
		data: JsonObjectSchema,
	})
	.openapi("VerifyRequest");

const signRoute = createRoute({
	method: "post",
	path: "/sign",
	tags: ["Signing"],
	summary: "Sign a JSON payload",
	description:
		"Computes a signature from the value of the payload rather than from its string representation, so the order of the properties does not affect the result.",
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
			description: "The signature of the payload",
			content: {
				"application/json": { schema: SignResponseSchema },
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

const verifyRoute = createRoute({
	method: "post",
	path: "/verify",
	tags: ["Signing"],
	summary: "Verify the signature of a JSON payload",
	description:
		"Recomputes the signature of `data` and compares it with the provided `signature`. As for /sign, the order of the properties of `data` does not affect the result.",
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: VerifyRequestSchema },
			},
		},
	},
	responses: {
		204: {
			description: "The signature is valid",
		},
		400: {
			description: "The signature is invalid, or the request body is malformed",
			content: {
				"application/json": { schema: ErrorSchema },
			},
		},
	},
});

export const signingRoutes = new OpenAPIHono()
	.openapi(signRoute, () => {
		throw new HTTPException(501, { message: "Not implemented" });
	})
	.openapi(verifyRoute, () => {
		throw new HTTPException(501, { message: "Not implemented" });
	});

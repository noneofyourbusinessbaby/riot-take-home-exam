import { z } from "@hono/zod-openapi";

export const JsonObjectSchema = z
	.record(z.string(), z.unknown())
	.openapi("JsonObject", {
		example: {
			name: "John Doe",
			age: 30,
			contact: {
				email: "john@example.com",
				phone: "123-456-7890",
			},
		},
	});

export const ErrorSchema = z
	.object({
		error: z.string().openapi({ example: "Invalid JSON payload" }),
	})
	.openapi("Error");

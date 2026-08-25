import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

const client = testClient(app);

const message = { message: "Hello World", timestamp: 1616161616 };

describe("POST /sign", () => {
	it("returns the signature of the payload", async () => {
		const response = await client.sign.$post({ json: message });
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ signature: expect.any(String) });
	});

	it.each([
		["a top-level string", JSON.stringify("Hello World")],
		["malformed JSON", "{ not json"],
	])("rejects %s", async (_case, body) => {
		const response = await app.request("/sign", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: expect.any(String) });
	});
});

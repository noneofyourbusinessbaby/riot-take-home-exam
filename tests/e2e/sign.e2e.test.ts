import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

const client = testClient(app);

const message = { message: "Hello World", timestamp: 1616161616 };

describe("POST /sign", () => {
	it("returns the signature of the payload", async () => {
		const res = await client.sign.$post({ json: message });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ signature: expect.any(String) });
	});

	// The typed client only accepts JSON objects, so the bodies the API has to
	// reject are sent with app.request. @see https://hono.dev/docs/guides/testing
	it("rejects a body that is not a JSON object", async () => {
		const res = await app.request("/sign", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify("Hello World"),
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	it("rejects a malformed JSON body", async () => {
		const res = await app.request("/sign", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{ not json",
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});
});

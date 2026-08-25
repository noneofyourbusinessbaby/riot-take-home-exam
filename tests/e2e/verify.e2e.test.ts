import { testClient } from "hono/testing";
import { assert, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

const client = testClient(app);

const message = { message: "Hello World", timestamp: 1616161616 };

describe("POST /verify", () => {
	it.each([
		["the original data", message],
		[
			"the same data with reordered properties",
			{ timestamp: 1616161616, message: "Hello World" },
		],
	] as const)("accepts %s", async (_case, data) => {
		const signed = await client.sign.$post({ json: message });
		assert(signed.ok);
		const { signature } = await signed.json();

		const response = await client.verify.$post({
			json: { signature, data },
		});

		expect(response.status).toBe(204);
		expect(await response.text()).toBe("");
	});

	it("rejects tampered data", async () => {
		const signed = await client.sign.$post({ json: message });
		assert(signed.ok);
		const { signature } = await signed.json();

		const response = await client.verify.$post({
			json: { signature, data: { ...message, message: "Goodbye World" } },
		});
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: expect.any(String) });
	});

	it.each([
		["a missing signature", JSON.stringify({ data: message })],
		["missing data", JSON.stringify({ signature: "a1b2c3d4e5f6g7h8i9j0" })],
		["malformed JSON", "{ not json"],
	])("rejects %s", async (_case, body) => {
		const response = await app.request("/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: expect.any(String) });
	});
});

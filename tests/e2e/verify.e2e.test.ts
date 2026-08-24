import { testClient } from "hono/testing";
import { assert, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

/** @see https://hono.dev/docs/helpers/testing */
const client = testClient(app);

const contact = { email: "john@example.com", phone: "123-456-7890" };
const message = { message: "Hello World", timestamp: 1616161616 };

describe("POST /verify", () => {
	it("accepts a signature produced by /sign", async () => {
		const signed = await client.sign.$post({ json: message });
		// Narrows the 200 | 400 union the route declares, so `signature` is typed.
		assert(signed.ok);
		const { signature } = await signed.json();

		const res = await client.verify.$post({
			json: { signature, data: message },
		});

		expect(res.status).toBe(204);
		expect(await res.text()).toBe("");
	});

	it("accepts the same data with its properties in another order", async () => {
		const signed = await client.sign.$post({ json: message });
		assert(signed.ok);
		const { signature } = await signed.json();

		const res = await client.verify.$post({
			json: {
				signature,
				data: { timestamp: 1616161616, message: "Hello World" },
			},
		});

		expect(res.status).toBe(204);
	});

	it("accepts data whose nested properties are in another order", async () => {
		const signed = await client.sign.$post({ json: { contact } });
		assert(signed.ok);
		const { signature } = await signed.json();

		const res = await client.verify.$post({
			json: {
				signature,
				data: { contact: { phone: contact.phone, email: contact.email } },
			},
		});

		expect(res.status).toBe(204);
	});

	it("rejects tampered data", async () => {
		const signed = await client.sign.$post({ json: message });
		assert(signed.ok);
		const { signature } = await signed.json();

		const res = await client.verify.$post({
			json: { signature, data: { ...message, message: "Goodbye World" } },
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	it("rejects a tampered signature", async () => {
		const signed = await client.sign.$post({ json: message });
		assert(signed.ok);
		const { signature } = await signed.json();

		const res = await client.verify.$post({
			json: {
				signature: `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`,
				data: message,
			},
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	// A signature is compared byte by byte while it travels as text, and the two
	// lengths only agree while it stays ASCII. A forgery counting the right number
	// of characters is still a rejection, never a failure.
	it("rejects a signature of the right length holding a non-ASCII character", async () => {
		const signed = await client.sign.$post({ json: message });
		assert(signed.ok);
		const { signature } = await signed.json();

		const res = await client.verify.$post({
			json: { signature: `${signature.slice(0, -1)}é`, data: message },
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	it("rejects a signature computed for another payload", async () => {
		const signed = await client.sign.$post({
			json: { ...message, message: "Goodbye World" },
		});
		assert(signed.ok);
		const { signature } = await signed.json();

		const res = await client.verify.$post({
			json: { signature, data: message },
		});

		expect(res.status).toBe(400);
	});

	// The typed client requires both properties, so the incomplete bodies the API
	// has to reject are sent with app.request.
	// @see https://hono.dev/docs/guides/testing
	it("rejects a body without a signature", async () => {
		const res = await app.request("/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: message }),
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	it("rejects a body without data", async () => {
		const res = await app.request("/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ signature: "a1b2c3d4e5f6g7h8i9j0" }),
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	it("rejects a malformed JSON body", async () => {
		const res = await app.request("/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{ not json",
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});
});

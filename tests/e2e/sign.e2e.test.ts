import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

/** @see https://hono.dev/docs/helpers/testing */
const client = testClient(app);

const contact = { email: "john@example.com", phone: "123-456-7890" };
const message = { message: "Hello World", timestamp: 1616161616 };

describe("POST /sign", () => {
	it("returns the signature of the payload", async () => {
		const res = await client.sign.$post({ json: message });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ signature: expect.any(String) });
	});

	it("returns the same signature whatever the order of the properties", async () => {
		const [signed, reordered] = await Promise.all([
			client.sign.$post({ json: message }),
			client.sign.$post({
				json: { timestamp: 1616161616, message: "Hello World" },
			}),
		]);

		expect(await reordered.json()).toEqual(await signed.json());
	});

	it("returns the same signature whatever the order of the nested properties", async () => {
		const [signed, reordered] = await Promise.all([
			client.sign.$post({ json: { contact } }),
			client.sign.$post({
				json: { contact: { phone: contact.phone, email: contact.email } },
			}),
		]);

		expect(await reordered.json()).toEqual(await signed.json());
	});

	it("returns a different signature when a value changes", async () => {
		const [signed, tampered] = await Promise.all([
			client.sign.$post({ json: message }),
			client.sign.$post({ json: { ...message, message: "Goodbye World" } }),
		]);

		expect(await tampered.json()).not.toEqual(await signed.json());
	});

	it("returns a different signature when the order of an array changes", async () => {
		const [signed, reordered] = await Promise.all([
			client.sign.$post({ json: { tags: ["admin", "beta"] } }),
			client.sign.$post({ json: { tags: ["beta", "admin"] } }),
		]);

		expect(await reordered.json()).not.toEqual(await signed.json());
	});

	it("distinguishes a numeric value from its string representation", async () => {
		const [signed, stringified] = await Promise.all([
			client.sign.$post({ json: { timestamp: 1616161616 } }),
			client.sign.$post({ json: { timestamp: "1616161616" } }),
		]);

		expect(await stringified.json()).not.toEqual(await signed.json());
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

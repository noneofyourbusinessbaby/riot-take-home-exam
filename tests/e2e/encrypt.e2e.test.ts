import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

/** @see https://hono.dev/docs/helpers/testing */
const client = testClient(app);

/** The encryption the API applies to one value: base64 of its JSON form. */
const base64 = (value: unknown) => btoa(JSON.stringify(value));

const contact = { email: "john@example.com", phone: "123-456-7890" };
const person = { name: "John Doe", age: 30, contact };

describe("POST /encrypt", () => {
	it("encrypts every depth-1 property of the payload", async () => {
		const res = await client.encrypt.$post({ json: person });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			name: base64("John Doe"),
			age: base64(30),
			contact: base64(contact),
		});
	});

	// The typed client only accepts JSON objects, so the bodies the API has to
	// reject are sent with app.request. @see https://hono.dev/docs/guides/testing
	it("rejects a body that is not a JSON object", async () => {
		const res = await app.request("/encrypt", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["John Doe"]),
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	it("rejects a malformed JSON body", async () => {
		const res = await app.request("/encrypt", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{ not json",
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});
});

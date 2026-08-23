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

	it("encrypts nested structures as a whole rather than property by property", async () => {
		const res = await client.encrypt.$post({
			json: { tags: ["admin", "beta"], address: { city: "Paris" } },
		});

		expect(await res.json()).toEqual({
			tags: base64(["admin", "beta"]),
			address: base64({ city: "Paris" }),
		});
	});

	it("encrypts every JSON scalar type into a string", async () => {
		const res = await client.encrypt.$post({
			json: { active: true, score: 4.5, nickname: null, empty: "" },
		});

		expect(await res.json()).toEqual({
			active: base64(true),
			score: base64(4.5),
			nickname: base64(null),
			empty: base64(""),
		});
	});

	it("returns an empty object for an empty payload", async () => {
		const res = await client.encrypt.$post({ json: {} });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({});
	});

	it("is deterministic for a given payload", async () => {
		const [first, second] = await Promise.all([
			client.encrypt.$post({ json: person }),
			client.encrypt.$post({ json: person }),
		]);

		expect(await first.json()).toEqual(await second.json());
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

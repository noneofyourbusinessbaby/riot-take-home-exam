import { testClient } from "hono/testing";
import { assert, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

/** @see https://hono.dev/docs/helpers/testing */
const client = testClient(app);

/** The encryption the API applies to one value: base64 of its JSON form. */
const base64 = (value: unknown) => btoa(JSON.stringify(value));

const contact = { email: "john@example.com", phone: "123-456-7890" };
const person = { name: "John Doe", age: 30, contact };

describe("POST /decrypt", () => {
	it("decrypts every encrypted depth-1 property", async () => {
		const res = await client.decrypt.$post({
			json: {
				name: base64("John Doe"),
				age: base64(30),
				contact: base64(contact),
			},
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(person);
	});

	it("restores the original JSON type of every decrypted value", async () => {
		const res = await client.decrypt.$post({
			json: {
				active: base64(true),
				score: base64(4.5),
				nickname: base64(null),
				tags: base64(["admin", "beta"]),
			},
		});

		expect(await res.json()).toEqual({
			active: true,
			score: 4.5,
			nickname: null,
			tags: ["admin", "beta"],
		});
	});

	it("leaves properties that were never encrypted unchanged", async () => {
		const res = await client.decrypt.$post({
			json: { name: base64("John Doe"), birth_date: "1998-11-19" },
		});

		expect(await res.json()).toEqual({
			name: "John Doe",
			birth_date: "1998-11-19",
		});
	});

	it("leaves a payload without any encrypted property unchanged", async () => {
		const res = await client.decrypt.$post({
			json: { name: "John Doe", birth_date: "1998-11-19" },
		});

		expect(await res.json()).toEqual({
			name: "John Doe",
			birth_date: "1998-11-19",
		});
	});

	it("returns the original payload when decrypting the output of /encrypt", async () => {
		const payload = { ...person, tags: ["admin", "beta"], active: true };

		const encrypted = await client.encrypt.$post({ json: payload });
		// Narrows the 200 | 400 union the route declares, so the body fed back to
		// /decrypt is typed as an encrypted payload rather than as an error.
		assert(encrypted.ok);

		const decrypted = await client.decrypt.$post({
			json: await encrypted.json(),
		});

		expect(decrypted.status).toBe(200);
		expect(await decrypted.json()).toEqual(payload);
	});

	// The typed client only accepts JSON objects, so the bodies the API has to
	// reject are sent with app.request. @see https://hono.dev/docs/guides/testing
	it("rejects a body that is not a JSON object", async () => {
		const res = await app.request("/decrypt", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(base64("John Doe")),
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});

	it("rejects a malformed JSON body", async () => {
		const res = await app.request("/decrypt", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{ not json",
		});

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: expect.any(String) });
	});
});

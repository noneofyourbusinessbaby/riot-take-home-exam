import { testClient } from "hono/testing";
import { assert, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

const client = testClient(app);

const base64 = (value: unknown) => btoa(JSON.stringify(value));

const contact = { email: "john@example.com", phone: "123-456-7890" };
const person = { name: "John Doe", age: 30, contact };

describe("POST /decrypt", () => {
	it("decrypts every encrypted property and leaves the others unchanged", async () => {
		const response = await client.decrypt.$post({
			json: {
				name: base64("John Doe"),
				age: base64(30),
				contact: base64(contact),
				birth_date: "1998-11-19",
			},
		});
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ ...person, birth_date: "1998-11-19" });
	});

	it("returns the original payload when decrypting the output of /encrypt", async () => {
		const payload = { ...person, tags: ["admin", "beta"], active: true };

		const encrypted = await client.encrypt.$post({ json: payload });
		// Narrows the 200 | 400 union, so the body fed back to /decrypt is typed as
		// an encrypted payload rather than as an error.
		assert(encrypted.ok);

		const decrypted = await client.decrypt.$post({
			json: await encrypted.json(),
		});
		const body = await decrypted.json();

		expect(decrypted.status).toBe(200);
		expect(body).toEqual(payload);
	});

	it.each([
		["a top-level string", JSON.stringify(base64("John Doe"))],
		["malformed JSON", "{ not json"],
	])("rejects %s", async (_case, body) => {
		const response = await app.request("/decrypt", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: expect.any(String) });
	});
});

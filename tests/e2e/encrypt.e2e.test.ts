import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

const client = testClient(app);

const base64 = (value: unknown) => btoa(JSON.stringify(value));

const contact = { email: "john@example.com", phone: "123-456-7890" };
const person = { name: "John Doe", age: 30, contact };

describe("POST /encrypt", () => {
	it("encrypts every depth-1 property of the payload", async () => {
		const response = await client.encrypt.$post({ json: person });
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			name: base64("John Doe"),
			age: base64(30),
			contact: base64(contact),
		});
	});

	it.each([
		["a top-level array", JSON.stringify(["John Doe"])],
		["malformed JSON", "{ not json"],
	])("rejects %s", async (_case, body) => {
		const response = await app.request("/encrypt", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: expect.any(String) });
	});
});

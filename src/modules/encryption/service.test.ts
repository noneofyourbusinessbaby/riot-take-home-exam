import { describe, expect, it } from "vitest";
import type { Cipher } from "./cipher.js";
import { EncryptionService } from "./service.js";

/**
 * Stands in for the port so the service is tested on its own: a value is a
 * ciphertext when it carries the marker, which base64 cannot tell.
 */
class MarkerCipher implements Cipher {
	encrypt(plaintext: string) {
		return `<${plaintext}>`;
	}

	decrypt(ciphertext: string) {
		return ciphertext.startsWith("<") && ciphertext.endsWith(">")
			? ciphertext.slice(1, -1)
			: undefined;
	}
}

const service = new EncryptionService(new MarkerCipher());

const contact = { email: "john@example.com", phone: "123-456-7890" };
const person = { name: "John Doe", age: 30, contact };

describe("EncryptionService", () => {
	describe("encryptPayload", () => {
		// A number is encrypted as a number and not as `"30"`, which is what lets
		// /decrypt give the type back.
		it("encrypts every depth-1 property without changing the type of its value", () => {
			expect(service.encryptPayload(person)).toEqual({
				name: '<"John Doe">',
				age: "<30>",
				contact: '<{"email":"john@example.com","phone":"123-456-7890"}>',
			});
		});

		// An array is encrypted as one value, and its order is part of that value.
		it("encrypts an array as a whole rather than element by element", () => {
			expect(service.encryptPayload({ tags: ["beta", "admin"] })).toEqual({
				tags: '<["beta","admin"]>',
			});
		});

		it("returns the properties in the order it was given them", () => {
			expect(Object.keys(service.encryptPayload(person))).toEqual([
				"name",
				"age",
				"contact",
			]);
		});

		it("returns an empty object for an empty payload", () => {
			expect(service.encryptPayload({})).toEqual({});
		});
	});

	describe("decryptPayload", () => {
		it("decrypts every encrypted property and restores its JSON type", () => {
			expect(
				service.decryptPayload({
					name: '<"John Doe">',
					age: "<30>",
					active: "<true>",
					nickname: "<null>",
					tags: '<["admin","beta"]>',
				}),
			).toEqual({
				name: "John Doe",
				age: 30,
				active: true,
				nickname: null,
				tags: ["admin", "beta"],
			});
		});

		it("leaves a property that was never encrypted unchanged", () => {
			expect(
				service.decryptPayload({
					name: '<"John Doe">',
					birth_date: "1998-11-19",
				}),
			).toEqual({ name: "John Doe", birth_date: "1998-11-19" });
		});

		it("leaves a value that is not a string unchanged", () => {
			expect(service.decryptPayload({ age: 30, contact })).toEqual({
				age: 30,
				contact,
			});
		});

		// The cipher accepted the value, so only the JSON parse says it was never
		// encrypted.
		it("leaves unchanged a value whose plaintext is not JSON", () => {
			expect(service.decryptPayload({ note: "<not json>" })).toEqual({
				note: "<not json>",
			});
		});

		it("returns the properties in the order it was given them", () => {
			expect(
				Object.keys(
					service.decryptPayload({
						name: '<"John Doe">',
						birth_date: "1998-11-19",
						age: "<30>",
					}),
				),
			).toEqual(["name", "birth_date", "age"]);
		});

		it("gives back the payload encryptPayload was handed", () => {
			const payload = { ...person, tags: ["admin", "beta"], active: true };

			expect(service.decryptPayload(service.encryptPayload(payload))).toEqual(
				payload,
			);
		});
	});
});

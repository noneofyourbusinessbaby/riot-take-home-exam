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
		it("encrypts every depth-1 property without changing the type of its value", () => {
			const encrypted = service.encryptPayload(person);

			expect(encrypted).toEqual({
				name: '<"John Doe">',
				age: "<30>",
				contact: '<{"email":"john@example.com","phone":"123-456-7890"}>',
			});
		});

		it("encrypts an array as a whole rather than element by element", () => {
			const encrypted = service.encryptPayload({ tags: ["beta", "admin"] });

			expect(encrypted).toEqual({
				tags: '<["beta","admin"]>',
			});
		});

		it("returns an empty object for an empty payload", () => {
			const encrypted = service.encryptPayload({});

			expect(encrypted).toEqual({});
		});
	});

	describe("decryptPayload", () => {
		it.each([
			["string", '<"John Doe">', "John Doe"],
			["number", "<30>", 30],
			["boolean", "<true>", true],
			["null", "<null>", null],
			["array", '<["admin","beta"]>', ["admin", "beta"]],
			["object", '<{"role":"admin"}>', { role: "admin" }],
		] as const)("restores an encrypted %s", (_case, encrypted, expected) => {
			const decrypted = service.decryptPayload({ value: encrypted });

			expect(decrypted).toEqual({ value: expected });
		});

		it.each([
			["an unencrypted plain string", "1998-11-19"],
			["an unencrypted number", 30],
			["an unencrypted object", contact],
			["ciphertext whose plaintext is not JSON", "<not json>"],
		] as const)("leaves %s unchanged", (_case, value) => {
			const decrypted = service.decryptPayload({ value });

			expect(decrypted).toEqual({ value });
		});

		it("gives back the payload encryptPayload was handed", () => {
			const payload = { ...person, tags: ["admin", "beta"], active: true };
			const encrypted = service.encryptPayload(payload);

			const decrypted = service.decryptPayload(encrypted);

			expect(decrypted).toEqual(payload);
		});
	});
});

import { describe, expect, it } from "vitest";
import { Base64Cipher } from "./cipher.base64.js";

const cipher = new Base64Cipher();

describe("Base64Cipher", () => {
	it.each([
		["ASCII", "John Doe"],
		["Unicode", "John Do☹e"],
		["an empty string", ""],
	])("round trips %s plaintext", (_case, plaintext) => {
		const ciphertext = cipher.encrypt(plaintext);

		expect(cipher.decrypt(ciphertext)).toBe(plaintext);
	});

	// Decoding ignores what is not base64 instead of rejecting it, so a value is
	// only accepted when re-encoding gives it back.
	it("returns undefined for a string it could not have produced", () => {
		const plaintext = cipher.decrypt("1998-11-19");

		expect(plaintext).toBeUndefined();
	});

	// Base64 authenticates nothing, so anything canonical decodes whoever wrote
	// it. A keyed cipher would settle it by failing here.
	it("accepts canonical base64 it did not produce", () => {
		const plaintext = cipher.decrypt("YWJj");

		expect(plaintext).toBe("abc");
	});
});

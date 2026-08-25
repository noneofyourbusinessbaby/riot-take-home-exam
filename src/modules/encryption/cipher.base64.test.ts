import { describe, expect, it } from "vitest";
import { Base64Cipher } from "./cipher.base64.js";

const cipher = new Base64Cipher();

describe("Base64Cipher", () => {
	it("round trips a non-ASCII character", () => {
		expect(cipher.decrypt(cipher.encrypt("John Do☹e"))).toBe("John Do☹e");
	});

	it("round trips the empty string", () => {
		expect(cipher.decrypt(cipher.encrypt(""))).toBe("");
	});

	// Decoding ignores what is not base64 instead of rejecting it, so a value is
	// only accepted when re-encoding gives it back.
	it("returns undefined for a string it could not have produced", () => {
		expect(cipher.decrypt("1998-11-19")).toBeUndefined();
	});

	// Base64 authenticates nothing, so anything canonical decodes whoever wrote
	// it. A keyed cipher would settle it by failing here.
	it("accepts canonical base64 it did not produce", () => {
		expect(cipher.decrypt("YWJj")).toBe("abc");
	});
});

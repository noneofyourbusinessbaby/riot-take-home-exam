import { describe, expect, it } from "vitest";
import { HmacSha256Signer } from "./signer.hmac-sha256.js";

const signer = new HmacSha256Signer("test-key");

const message = '{"message":"Hello World","timestamp":1616161616}';

describe("HmacSha256Signer", () => {
	it("signs a message differently under another secret", () => {
		expect(new HmacSha256Signer("another-secret").sign(message)).not.toBe(
			signer.sign(message),
		);
	});

	it("accepts the signature it produced", () => {
		expect(signer.verify(message, signer.sign(message))).toBe(true);
	});

	it("rejects the signature of another message", () => {
		expect(signer.verify(message, signer.sign("Goodbye World"))).toBe(false);
	});

	it("rejects a tampered signature", () => {
		const signature = signer.sign(message);

		expect(
			signer.verify(
				message,
				`${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`,
			),
		).toBe(false);
	});

	it("rejects a truncated signature", () => {
		expect(signer.verify(message, signer.sign(message).slice(0, -1))).toBe(
			false,
		);
	});

	// A signature is compared byte by byte while it travels as text, and one
	// non-ASCII character makes it longer than the hex it imitates.
	// `timingSafeEqual` throws on buffers of different lengths, so the comparison
	// is guarded by one: a forgery of the right character count is a rejection,
	// never a failure.
	it("rejects a signature of the right length holding a non-ASCII character", () => {
		expect(
			signer.verify(message, `${signer.sign(message).slice(0, -1)}é`),
		).toBe(false);
	});
});

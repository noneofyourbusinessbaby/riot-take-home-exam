import { describe, expect, it } from "vitest";
import { HmacSha256Signer } from "./signer.hmac-sha256.js";

const signer = new HmacSha256Signer("test-key");

const message = '{"message":"Hello World","timestamp":1616161616}';

describe("HmacSha256Signer", () => {
	it("signs a message differently under another secret", () => {
		const anotherSigner = new HmacSha256Signer("another-secret");

		const signature = signer.sign(message);
		const otherSignature = anotherSigner.sign(message);

		expect(otherSignature).not.toBe(signature);
	});

	it("accepts the signature it produced", () => {
		const signature = signer.sign(message);

		const result = signer.verify(message, signature);

		expect(result).toBe(true);
	});

	it.each([
		["another message", () => signer.sign("Goodbye World")],
		[
			"a changed hexadecimal character",
			() => {
				const signature = signer.sign(message);
				return `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`;
			},
		],
		["a truncated value", () => signer.sign(message).slice(0, -1)],
		[
			"a non-ASCII final character",
			() => `${signer.sign(message).slice(0, -1)}é`,
		],
	] as const)("rejects %s", (_case, signature) => {
		const result = signer.verify(message, signature());

		expect(result).toBe(false);
	});
});

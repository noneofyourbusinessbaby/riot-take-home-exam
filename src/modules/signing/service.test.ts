import { describe, expect, it } from "vitest";
import { SigningService } from "./service.js";
import type { Signer } from "./signer.js";

/**
 * Stands in for the port and keeps what it was handed, so the canonical form the
 * service computes is read directly rather than inferred from two signatures
 * differing.
 */
class RecordingSigner implements Signer {
	readonly messages: string[] = [];

	sign(message: string) {
		this.messages.push(message);
		return `signature of ${message}`;
	}

	verify(message: string, signature: string) {
		return this.sign(message) === signature;
	}
}

const message = { message: "Hello World", timestamp: 1616161616 };

describe("SigningService", () => {
	describe("signPayload", () => {
		it.each([
			[
				"sorts object properties",
				{ timestamp: 1616161616, message: "Hello World" },
				'{"message":"Hello World","timestamp":1616161616}',
			],
			[
				"preserves array order",
				{ tags: ["beta", "admin"] },
				'{"tags":["beta","admin"]}',
			],
		] as const)("%s before signing", (_case, payload, canonical) => {
			const signer = new RecordingSigner();

			const signature = new SigningService(signer).signPayload(payload);

			expect(signer.messages).toEqual([canonical]);
			expect(signature).toBe(`signature of ${canonical}`);
		});
	});

	describe("verifyPayload", () => {
		it.each([
			[
				"the same data with reordered properties",
				{ timestamp: 1616161616, message: "Hello World" },
				true,
			],
			["tampered data", { ...message, message: "Goodbye World" }, false],
		] as const)(
			"returns the expected result for %s",
			(_case, payload, expected) => {
				const service = new SigningService(new RecordingSigner());
				const signature = service.signPayload(message);

				const result = service.verifyPayload(payload, signature);

				expect(result).toBe(expected);
			},
		);
	});
});

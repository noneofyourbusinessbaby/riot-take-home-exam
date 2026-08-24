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
		it("signs the value of the payload, not the order it was written in", () => {
			const signer = new RecordingSigner();

			const signature = new SigningService(signer).signPayload({
				timestamp: 1616161616,
				message: "Hello World",
			});

			expect(signer.messages).toEqual([
				'{"message":"Hello World","timestamp":1616161616}',
			]);
			expect(signature).toBe(
				'signature of {"message":"Hello World","timestamp":1616161616}',
			);
		});

		// An array is a value and not a record: its order is part of what is signed.
		it("keeps the order of an array", () => {
			const signer = new RecordingSigner();

			new SigningService(signer).signPayload({ tags: ["beta", "admin"] });

			expect(signer.messages).toEqual(['{"tags":["beta","admin"]}']);
		});
	});

	describe("verifyPayload", () => {
		it("accepts the same data with its properties in another order", () => {
			const service = new SigningService(new RecordingSigner());
			const signature = service.signPayload(message);

			expect(
				service.verifyPayload(
					{ timestamp: 1616161616, message: "Hello World" },
					signature,
				),
			).toBe(true);
		});

		it("rejects tampered data", () => {
			const service = new SigningService(new RecordingSigner());
			const signature = service.signPayload(message);

			expect(
				service.verifyPayload(
					{ ...message, message: "Goodbye World" },
					signature,
				),
			).toBe(false);
		});
	});
});

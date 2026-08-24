import { createHmac, timingSafeEqual } from "node:crypto";
import type { Signer } from "./signer.js";

/**
 * HMAC-SHA256, keyed by the secret it is handed rather than by one it reads: the
 * key belongs to the deployment, so the composition root passes it in.
 */
export class HmacSha256Signer implements Signer {
	constructor(private readonly secret: string) {}

	sign(message: string): string {
		return createHmac("sha256", this.secret).update(message).digest("hex");
	}

	verify(message: string, signature: string): boolean {
		const expected = Buffer.from(this.sign(message));
		const provided = Buffer.from(signature);

		if (expected.length !== provided.length) {
			return false;
		}

		return timingSafeEqual(expected, provided);
	}
}

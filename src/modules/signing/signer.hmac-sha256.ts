import { createHmac, timingSafeEqual } from "node:crypto";
import type { Signer } from "./signer.js";

/**
 * HMAC-SHA256, keyed by the secret it is given rather than by one of its own:
 * the key is what makes a signature unforgeable, so it belongs to the deployment
 * and is handed to the adapter when the composition root builds it instead of
 * being read from the environment here.
 */
export const hmacSha256 = (secret: string): Signer => {
	const hmac = (message: string) =>
		createHmac("sha256", secret).update(message).digest("hex");

	return {
		sign: hmac,

		verify: (message, signature) => {
			const expected = Buffer.from(hmac(message));
			const provided = Buffer.from(signature);
			// Compared in constant time, so that the response time of /verify does not
			// tell a forger how much of a signature they already got right. The lengths
			// are checked first because timingSafeEqual throws on operands of different
			// sizes, and a length is not a secret: it is fixed by the algorithm. They
			// are the lengths of the buffers rather than of the strings, since a single
			// non-ASCII character makes the two disagree and the check would let a
			// mismatch through to timingSafeEqual.
			if (expected.length !== provided.length) {
				return false;
			}

			return timingSafeEqual(expected, provided);
		},
	};
};

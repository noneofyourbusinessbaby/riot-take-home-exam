import type { Cipher } from "./cipher.js";

/**
 * Base64, as the exercise asks. It is an encoding and not a cipher, which is why
 * it is kept behind the `Cipher` port. `Buffer` rather than `btoa`, which only
 * accepts Latin-1 and would throw on an emoji.
 */
export class Base64Cipher implements Cipher {
	encrypt(plaintext: string): string {
		return Buffer.from(plaintext, "utf8").toString("base64");
	}

	decrypt(ciphertext: string): string | undefined {
		// Decoding ignores non-base64 characters instead of rejecting them, so a
		// value is only accepted when re-encoding gives it back: "1998-11-19"
		// decodes to something, but not to itself.
		const decoded = Buffer.from(ciphertext, "base64");
		return decoded.toString("base64") === ciphertext
			? decoded.toString("utf8")
			: undefined;
	}
}

import type { Cipher } from "./cipher.js";

/**
 * Base64, as the exercise asks. It is an encoding rather than a cipher — it
 * holds no key and anyone can reverse it — which is exactly why it is kept
 * behind the `Cipher` port. Node's `Buffer` does the encoding rather than
 * `btoa`, which only accepts Latin-1 and would throw on a payload holding, say,
 * an emoji.
 */
export const base64: Cipher = {
	encrypt: (plaintext) => Buffer.from(plaintext, "utf8").toString("base64"),

	decrypt: (ciphertext) => {
		// Decoding ignores the characters that are not base64 instead of rejecting
		// them, so a value is only accepted when re-encoding what was decoded gives
		// it back: "1998-11-19" decodes to something, but not to itself.
		const decoded = Buffer.from(ciphertext, "base64");
		return decoded.toString("base64") === ciphertext
			? decoded.toString("utf8")
			: undefined;
	},
};

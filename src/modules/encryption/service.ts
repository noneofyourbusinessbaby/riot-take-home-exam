import type { Cipher } from "./cipher.js";

export class EncryptionService {
	constructor(private readonly cipher: Cipher) {}

	/**
	 * Each depth-1 property is encrypted through its JSON form, not its string
	 * form: encrypting the number `30` as `"30"` would lose its type and /decrypt
	 * could only give a string back. Nested values are encrypted as a whole, so
	 * the result is a flat object of strings.
	 */
	encryptPayload(payload: Record<string, unknown>): Record<string, string> {
		return Object.fromEntries(
			Object.entries(payload).map(([property, value]): [string, string] => [
				property,
				this.cipher.encrypt(JSON.stringify(value)),
			]),
		);
	}

	/**
	 * A payload can be partially encrypted, so a property that never went through
	 * /encrypt keeps whatever JSON type it has. Only a string can be a ciphertext.
	 */
	decryptPayload(payload: Record<string, unknown>): Record<string, unknown> {
		return Object.fromEntries(
			Object.entries(payload).map(([property, value]): [string, unknown] => [
				property,
				typeof value === "string" ? this.decryptValue(value) : value,
			]),
		);
	}

	/**
	 * A value counts as encrypted when the cipher accepts it and what comes out is
	 * JSON. Base64 authenticates nothing, so this is a detection and not a
	 * certainty: a string that happens to be the base64 of a JSON value passes. A
	 * keyed cipher would settle it by failing to decrypt, without changing this
	 * method.
	 */
	private decryptValue(value: string): unknown {
		const plaintext = this.cipher.decrypt(value);
		if (plaintext === undefined) {
			return value;
		}

		try {
			return JSON.parse(plaintext);
		} catch {
			return value;
		}
	}
}

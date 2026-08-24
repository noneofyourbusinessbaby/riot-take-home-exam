import type { Cipher } from "./cipher.js";

/**
 * What /encrypt and /decrypt need from the application, and the driving port of
 * the encryption side: the routes depend on this interface rather than on the
 * factory below, so the HTTP layer is one adapter driving the application among
 * the others it could have (a CLI, a queue consumer, a test double).
 */
export interface EncryptionService {
	encryptPayload(payload: Record<string, unknown>): Record<string, string>;
	decryptPayload(payload: Record<string, string>): Record<string, unknown>;
}

/**
 * The part that is about payloads rather than about algorithms: which properties
 * are encrypted, and how a value is turned into something the cipher can take.
 * The `Cipher` is received rather than picked here, so the choice lives in the
 * composition root alone and a caller can substitute another implementation
 * without touching this file.
 */
export const createEncryptionService = (cipher: Cipher): EncryptionService => {
	/**
	 * Every property at depth 1 is encrypted through its JSON representation
	 * rather than through its string form: encrypting the number `30` as `"30"`
	 * would lose its type, and /decrypt could only ever give a string back. Nested
	 * objects and arrays are encrypted as a whole, so the result is a flat object
	 * of strings.
	 */
	const encryptPayload = (
		payload: Record<string, unknown>,
	): Record<string, string> =>
		Object.fromEntries(
			Object.entries(payload).map(([property, value]): [string, string] => [
				property,
				cipher.encrypt(JSON.stringify(value)),
			]),
		);

	/**
	 * A value counts as encrypted when the cipher accepts it and what comes out is
	 * the JSON that /encrypt produces. Base64 authenticates nothing, so this stays
	 * a detection rather than a certainty: a payload may hold a string that happens
	 * to be the base64 of a JSON value without ever having been encrypted. A keyed
	 * cipher would settle the question by failing to decrypt, and this function
	 * would not change.
	 */
	const decryptValue = (value: string): unknown => {
		const plaintext = cipher.decrypt(value);
		if (plaintext === undefined) {
			return value;
		}

		try {
			return JSON.parse(plaintext);
		} catch {
			return value;
		}
	};

	/**
	 * Restores the properties /encrypt produced and returns the others as they
	 * came, which is what makes the two endpoints reversible.
	 */
	const decryptPayload = (
		payload: Record<string, string>,
	): Record<string, unknown> =>
		Object.fromEntries(
			Object.entries(payload).map(([property, value]): [string, unknown] => [
				property,
				decryptValue(value),
			]),
		);

	return { encryptPayload, decryptPayload };
};

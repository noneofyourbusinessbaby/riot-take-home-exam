/**
 * The encryption algorithm, reduced to what the application needs of it. This is
 * a driven port: the interface belongs to the encryption module, an adapter in
 * the same directory implements it — `base64.ts` today — and the composition root
 * in `src/app.ts` names the one in use. Replacing base64 with a real algorithm is
 * adding a file next to this one and changing that line; nothing else in the
 * codebase knows how a value is encrypted.
 */
export interface Cipher {
	encrypt(plaintext: string): string;
	/**
	 * The plaintext, or `undefined` when the value was not produced by this
	 * cipher. /decrypt needs that answer to leave the other properties untouched.
	 */
	decrypt(ciphertext: string): string | undefined;
}

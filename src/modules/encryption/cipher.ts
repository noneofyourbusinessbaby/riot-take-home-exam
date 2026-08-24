export interface Cipher {
	encrypt(plaintext: string): string;
	/**
	 * The plaintext, or `undefined` when the value was not produced by this
	 * cipher, which is how /decrypt leaves the other properties untouched.
	 */
	decrypt(ciphertext: string): string | undefined;
}

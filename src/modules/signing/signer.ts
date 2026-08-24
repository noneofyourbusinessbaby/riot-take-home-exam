/**
 * The signature algorithm, reduced to what the application needs of it. Like
 * `Cipher`, it is a driven port: an adapter in the same directory implements it —
 * `hmac-sha256.ts` today — and the composition root in `src/app.ts` names the one
 * in use. The port says
 * nothing of keys — an implementation that needs one is given it when it is
 * built, so the application never handles a secret to sign or verify.
 */
export interface Signer {
	sign(message: string): string;
	verify(message: string, signature: string): boolean;
}

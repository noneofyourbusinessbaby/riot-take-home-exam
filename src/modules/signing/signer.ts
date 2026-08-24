export interface Signer {
	sign(message: string): string;
	verify(message: string, signature: string): boolean;
}

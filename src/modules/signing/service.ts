import canonicalize from "canonicalize";
import type { Signer } from "./signer.js";

/**
 * The signature is computed on the value of the payload, not on the way it was
 * written, so properties are sorted by name while arrays keep their order. This
 * is RFC 8785, and `canonicalize` is its reference implementation: the spec has
 * enough corners (number formatting, lone surrogates) that a second one could
 * only disagree with it.
 * @see https://www.rfc-editor.org/rfc/rfc8785
 * @see https://github.com/erdtman/canonicalize
 */
const canonical = (payload: Record<string, unknown>): string => {
	const serialized = canonicalize(payload);

	// `canonicalize` returns undefined for what JSON cannot represent (undefined,
	// a function, a symbol). A payload parsed from a JSON body is never one of
	// those, so this states the invariant rather than handling a case.
	if (serialized === undefined) {
		throw Error("The payload has no canonical JSON representation");
	}

	return serialized;
};

export class SigningService {
	constructor(private readonly signer: Signer) {}

	signPayload(payload: Record<string, unknown>): string {
		return this.signer.sign(canonical(payload));
	}

	verifyPayload(payload: Record<string, unknown>, signature: string): boolean {
		return this.signer.verify(canonical(payload), signature);
	}
}

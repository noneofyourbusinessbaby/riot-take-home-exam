import canonicalize from "canonicalize";
import type { Signer } from "./signer.js";

/**
 * What /sign and /verify need from the application, and the driving port of the
 * signing side. A route knows a payload and a signature; it never learns which
 * algorithm produced one, nor that a key exists.
 */
export interface SigningService {
	signPayload(payload: Record<string, unknown>): string;
	verifyPayload(payload: Record<string, unknown>, signature: string): boolean;
}

/**
 * The signature is computed on the value of the payload and not on the way it
 * happened to be written, so the payload is serialized canonically: properties
 * are sorted by name, while arrays keep their order since there it carries
 * meaning. This is the transformation RFC 8785 describes, and the serializer is
 * the reference implementation of it, published by the authors of the RFC — the
 * specification has enough corners (number formatting, lone surrogates) that
 * writing a second implementation of it would only be a way to disagree with the
 * first.
 *
 * It sits above the port because it is about what gets signed rather than about
 * how, and so it holds whichever `Signer` the application is built with.
 * @see https://www.rfc-editor.org/rfc/rfc8785
 * @see https://github.com/erdtman/canonicalize
 */
const canonical = (payload: Record<string, unknown>): string => {
	const serialized = canonicalize(payload);

	// `canonicalize` is typed `string | undefined` because it gives back
	// undefined for the values JSON has no representation for at all — undefined
	// itself, a function, a symbol. A payload parsed from a JSON body is never
	// one of those, so this states the invariant rather than handling a case.
	if (serialized === undefined) {
		throw Error("The payload has no JSON representation");
	}

	return serialized;
};

/**
 * The `Signer` is received rather than picked here, so the choice of algorithm —
 * and the secret that keys it — lives in the composition root alone.
 */
export const createSigningService = (signer: Signer): SigningService => ({
	signPayload: (payload) => signer.sign(canonical(payload)),

	verifyPayload: (payload, signature) =>
		signer.verify(canonical(payload), signature),
});

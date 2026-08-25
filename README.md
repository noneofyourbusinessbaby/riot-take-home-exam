# Riot take-home exercise

An HTTP API exposing four endpoints: `/encrypt`, `/decrypt`, `/sign` and
`/verify`. Their contract is the OpenAPI document the API serves.

Deployed demo: [Railway](https://riot-take-home-exam-production.up.railway.app/)
([Swagger UI](https://riot-take-home-exam-production.up.railway.app/ui),
[OpenAPI document](https://riot-take-home-exam-production.up.railway.app/doc)).

## Setup

Node 26 (see `.nvmrc`) and Yarn 4, which comes from Corepack.

```sh
yarn install
cp .env.example .env
yarn dev
```

- <http://localhost:3000/ui> Swagger UI, to exercise the endpoints
- <http://localhost:3000/doc> the OpenAPI document

`SIGNING_SECRET` has no default and the process refuses to start without it, see
[SECURITY.md](SECURITY.md). To work on the code, see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Docker

The production image: compiled, no watch mode, no `.env`.

```sh
docker build --tag riot-take-home-exam .
docker run --rm --read-only --publish 3000:3000 \
  --env SIGNING_SECRET=your-secret riot-take-home-exam
```

## Design

Ports and adapters, because the exercise asks for both algorithms to be
replaceable. Each module states what it needs of an algorithm as an interface
(`cipher.ts`, `signer.ts`) and implements it in one file per algorithm
(`cipher.base64.ts`, `signer.hmac-sha256.ts`). `src/app.ts` is the only place one
is named:

```ts
const cipher = new Base64Cipher();
const signer = new HmacSha256Signer(config.SIGNING_SECRET);
```

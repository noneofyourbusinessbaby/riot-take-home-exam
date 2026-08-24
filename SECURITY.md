# Security

`SIGNING_SECRET` is the HMAC-SHA256 key behind `/sign` and `/verify`. Anyone
holding it can forge a signature the API accepts.

## Secret management

| Environment | Source                                                |
| ----------- | ----------------------------------------------------- |
| Development | `.env`, git-ignored, templated by `.env.example`      |
| Test        | `.env.test`, committed, fixture data only             |
| Deployment  | a secret manager, injected as an environment variable |

**Idea: never hold the key.** A vault could sign and verify on its own side
(HashiCorp Vault or OpenBao Transit, AWS KMS `GenerateMac` / `VerifyMac`), so
the key would never leave it and the process would only hold credentials to call
the API, with rotation, audit and revocation on top.

It would be one new `Signer` adapter and one line in `src/app.ts`; the service
and the routes would not change. `Signer` would turn async, signing being a
network call.

## Generate a key

```sh
openssl rand -hex 32   # one per environment
```

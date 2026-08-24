# The version `.nvmrc` pins, so the image runs what CI and development run. Named
# once and referred to by the stages below rather than repeated or hidden behind
# an ARG: this is the single line to bump, and the one Dependabot can read.
FROM node:26.7.0-alpine AS node

# Everything the two build stages share: Yarn, the working directory and the
# manifests. Copying only the manifests before installing means the install layer
# is reused as long as `yarn.lock` is untouched, which a source change does not do.
FROM node AS base
# Yarn 4 is not vendored in the repository; Corepack fetches the version pinned by
# the `packageManager` field, exactly as the CI workflow does.
RUN npm install --global corepack@latest && corepack enable
WORKDIR /app
# Husky installs git hooks from `postinstall`, and an image has no repository to
# install them into. The script itself ends in `|| true` — husky's own advice —
# because the production install below has no husky binary at all to skip.
# @see https://typicode.github.io/husky/how-to.html#ci-server-and-docker
ENV HUSKY=0
COPY package.json yarn.lock .yarnrc.yml ./

# Compiles TypeScript, so it needs the dev dependencies.
FROM base AS build
RUN yarn install --immutable
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN yarn build

# The same install without the dev dependencies, resolved from the same lockfile,
# so the runtime carries Hono and Zod but not TypeScript, Vitest or Biome.
# @see https://yarnpkg.com/cli/workspaces/focus
FROM base AS dependencies
RUN yarn workspaces focus --production

# Distroless: the runtime holds the Node binary, its shared libraries and the
# application, and nothing else — no shell, no package manager, no busybox — so
# what an attacker would find after a remote code execution is a process and no
# tools. `nonroot` is the variant that runs as uid 65532 and owns nothing it
# executes. Node 24 because it is the newest distroless publishes; the stages
# above compile on the version `.nvmrc` pins, and the CD workflow boots this image
# and exercises the API against it, so the pair is checked rather than assumed.
# @see https://github.com/GoogleContainerTools/distroless
FROM gcr.io/distroless/nodejs24-debian13:nonroot AS runtime
# `PORT` is declared rather than left to the schema's default so that one value
# answers for the process, the healthcheck below and anyone reading `docker
# inspect`; overriding it at run time moves all three at once.
ENV NODE_ENV=production \
	PORT=3000
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Not documentation: `dist` is ESM, and Node reads `"type": "module"` from here to
# know it. Without this file the first import fails at startup.
COPY package.json ./

# Already the default of the `nonroot` tag, and stated anyway: it is the property
# the image is chosen for, and a `FROM` edited to another variant should read as
# the contradiction it would be. Everything copied above is owned by root and only
# read, so the process can execute the application and modify none of it.
USER nonroot:nonroot
EXPOSE 3000

# The liveness probe the API already exposes, so an orchestrator reading the
# image's own healthcheck gets the same answer as one configured by hand. There is
# no shell here to run `curl` or expand a variable, so the check is Node reading
# its own environment and calling `fetch`, both of which the runtime already has.
# `--start-interval` polls every second until the first success, which makes a
# container ready in about a second instead of waiting out the first 30s interval.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --start-interval=1s \
	CMD ["/nodejs/bin/node", "--eval", "fetch(`http://127.0.0.1:${process.env.PORT}/health`).then(({ ok }) => process.exit(ok ? 0 : 1), () => process.exit(1))"]

# The image's entrypoint is the Node binary, so the command is the script it runs.
# `yarn start` could not be it in any case: it passes `--env-file=.env`, and a
# container has no `.env` — `SIGNING_SECRET` is handed to it by whatever runs it
# (`docker run --env`, a compose file, the orchestrator's secret store). The
# process refuses to start if it is missing, which is the intended failure.
CMD ["dist/index.js"]

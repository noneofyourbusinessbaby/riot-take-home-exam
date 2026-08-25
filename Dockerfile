# The version `.nvmrc` pins, named once so there is a single line to bump.
FROM node:26.7.0-alpine AS node

FROM node AS base
RUN npm install --global corepack@latest && corepack enable
WORKDIR /app
# Husky installs git hooks from `postinstall`, and an image has no repository to
# install them into.
# @see https://typicode.github.io/husky/how-to.html#ci-server-and-docker
ENV HUSKY=0
# Only the manifests, so the install layer survives a source change.
COPY package.json yarn.lock .yarnrc.yml ./

FROM base AS build
RUN yarn install --immutable
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN yarn build

# The same install without the dev dependencies, from the same lockfile.
# @see https://yarnpkg.com/cli/workspaces/focus
FROM base AS dependencies
RUN yarn workspaces focus --production

# Node 24 because it is the newest distroless publishes; the stages above compile
# on the version `.nvmrc` pins.
# @see https://github.com/GoogleContainerTools/distroless
FROM gcr.io/distroless/nodejs24-debian13:nonroot AS runtime
# Declared rather than left to the schema's default so one value answers for the
# process, the healthcheck below and `docker inspect`.
ENV NODE_ENV=production \
	PORT=3000
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# `dist` is ESM, and Node reads `"type": "module"` from here to know it. Without
# this file the first import fails at startup.
COPY package.json ./

USER nonroot:nonroot
EXPOSE 3000

# There is no shell here to run `curl` or expand a variable, so the check is Node
# reading its own environment and calling `fetch`. `--start-interval` polls every
# second until the first success instead of waiting out the first 30s interval.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --start-interval=1s \
	CMD ["/nodejs/bin/node", "--eval", "fetch(`http://127.0.0.1:${process.env.PORT}/health`).then(({ ok }) => process.exit(ok ? 0 : 1), () => process.exit(1))"]

# The entrypoint is the Node binary, so the command is the script it runs.
# `yarn start` could not be: it passes `--env-file=.env`, and a container has no
# `.env`. `SIGNING_SECRET` is handed to it by whatever runs the image.
CMD ["dist/index.js"]

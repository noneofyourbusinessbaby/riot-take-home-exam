import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { config } from "./config.js";

const server = serve(
	{
		fetch: app.fetch,
		port: config.PORT,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);

// Node installs no handler for these, and a process that ignores SIGTERM is not
// stopped but killed once the grace period runs out — `docker stop`, a rolling
// update and a Ctrl-C in a terminal all start by sending one. Closing the server
// lets the requests in flight finish and refuses new connections meanwhile.
// `once` rather than `on`, so a second signal still reaches the default handler
// and ends a shutdown that hangs.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, () => {
		server.close((error) => {
			if (error) {
				console.error(error);
				process.exit(1);
			}
			process.exit(0);
		});
	});
}

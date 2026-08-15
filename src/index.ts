import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { encryptionRoutes } from "./routes/encryption.js";
import { signingRoutes } from "./routes/signing.js";

const app = new OpenAPIHono();

app.route("/", encryptionRoutes);
app.route("/", signingRoutes);

app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "Riot take home exercise",
	},
});
app.get("/ui", swaggerUI({ url: "/doc" }));
app.get("/health", (c) => c.text("OK"));

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);

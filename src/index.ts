export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/api/health") {
			return Response.json({
				status: "ok",
				service: "classque-dev",
				timestamp: new Date().toISOString(),
			});
		}

		if (url.pathname === "/api/users") {
			try {
				const { results } = await env.DB.prepare(
					"SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 50"
				).all();
				return Response.json({ success: true, data: results });
			} catch (error: any) {
				return Response.json(
					{ success: false, error: error.message || "Failed to fetch users" },
					{ status: 500 }
				);
			}
		}

		return Response.json({
			message: "Cloudflare Worker + D1 is running!",
			endpoints: [
				{ path: "/api/health", description: "Health check endpoint" },
				{ path: "/api/users", description: "Fetch users from Cloudflare D1" },
			],
		});
	},
};

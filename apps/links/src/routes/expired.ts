import { Elysia } from "elysia";

const EXPIRED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Link Expired</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			background: oklch(0.18 0.006 286.033);
			color: oklch(0.88 0.008 286.033);
			min-height: 100dvh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1.5rem;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		}
		.container {
			text-align: center;
			max-width: 400px;
		}
		.icon-wrapper {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 4rem;
			height: 4rem;
			border-radius: 0.35rem;
			background: oklch(0.28 0.006 286.033);
			border: 1px solid oklch(0.28 0.006 286.033);
			margin-bottom: 1.5rem;
		}
		.icon-wrapper svg {
			width: 2rem;
			height: 2rem;
			color: oklch(0.55 0.006 286.033);
		}
		h1 {
			font-size: 1.25rem;
			font-weight: 600;
			margin-bottom: 0.5rem;
			letter-spacing: -0.01em;
		}
		p {
			color: oklch(0.55 0.006 286.033);
			font-size: 0.875rem;
			line-height: 1.6;
			text-wrap: pretty;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="icon-wrapper">
			<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256">
				<path d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z"/>
			</svg>
		</div>
		<h1>This link has expired</h1>
		<p>The link you're trying to access is no longer available. It may have been set to expire after a certain date.</p>
	</div>
</body>
</html>`;

export const expiredRoute = new Elysia().get("/expired", () => {
	return new Response(EXPIRED_HTML, {
		status: 410,
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
});

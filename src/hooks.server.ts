import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_AUTH_URL } from '$env/static/public';

const AUTH_ORIGIN = new URL(PUBLIC_AUTH_URL).origin;

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/app')) {
		const cookie = event.request.headers.get('cookie');

		const res = await fetch(`${AUTH_ORIGIN}/api/auth/get-session`, {
			headers: cookie ? { cookie } : {}
		}).catch(() => null);

		const session = res?.ok ? ((await res.json()) as { user?: unknown } | null) : null;
		if (!session?.user) redirect(303, '/login');
	}

	return resolve(event);
};

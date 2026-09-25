import { PUBLIC_AUTH_URL } from '$env/static/public';
import { FetchError, ofetch, type FetchOptions } from 'ofetch';

const api = ofetch.create({
	baseURL: `${PUBLIC_AUTH_URL.replace(/\/$/, '')}/api`,
	credentials: 'include'
});

export interface Parser<T> {
	parse(data: unknown): T;
}

export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

export async function request<T>(
	path: string,
	schema: Parser<T>,
	options: FetchOptions = {}
): Promise<T> {
	try {
		return schema.parse(await api(path, options));
	} catch (error) {
		if (error instanceof FetchError) {
			throw new ApiError(error.data?.error ?? error.message, error.status ?? 500);
		}
		throw error;
	}
}

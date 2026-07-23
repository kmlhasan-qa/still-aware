import { expect, type APIRequestContext } from '@playwright/test';

export const LOGIN_PATH = '/api/login';

export const VALID_CREDENTIALS = {
	email: 'testautomation@mailsac.com',
	password: 'Password',
};

export const DISABLED_CREDENTIALS = {
	email: 'disabledaccount@mailsac.com',
	password: 'Password',
};

function extractToken(body: Record<string, any>): string | null {
	const token = body.token ?? body.access_token ?? body.data?.token ?? body.data?.access_token;
	return typeof token === 'string' && token.length > 0 ? token : null;
}

let cachedToken: string | null = null;

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function postLoginWithRetry(
	request: APIRequestContext,
	data: Record<string, string>
): Promise<Awaited<ReturnType<APIRequestContext['post']>>> {
	let response = await postLogin(request, data);

	for (let attempt = 1; response.status() === 429 && attempt <= 12; attempt++) {
		await delay(5000);
		response = await postLogin(request, data);
	}

	return response;
}

export async function postLogin(
	request: APIRequestContext,
	data: Record<string, string> = VALID_CREDENTIALS
) {
	return request.post(LOGIN_PATH, {
		data,
	});
}


async function loginAndStoreToken(request: APIRequestContext): Promise<string> {
	const response = await postLoginWithRetry(request, VALID_CREDENTIALS);

	expect(response.status()).toBe(200);

	const body = await response.json();
	const token = extractToken(body);

	expect(token, `Expected auth token in login response: ${JSON.stringify(body)}`).toBeTruthy();

	cachedToken = token as string;
	return cachedToken;
}

export async function getCachedLoginToken(request: APIRequestContext): Promise<string> {
	if (cachedToken) {
		return cachedToken;
	}

	return loginAndStoreToken(request);
}

export async function getFreshLoginToken(request: APIRequestContext): Promise<string> {
	cachedToken = null;
	return loginAndStoreToken(request);
}

export async function loginAndGetToken(
	request: APIRequestContext,
	options: { refresh?: boolean } = {}
): Promise<string> {
	if (!options.refresh && cachedToken) {
		return cachedToken;
	}

	return loginAndStoreToken(request);
}
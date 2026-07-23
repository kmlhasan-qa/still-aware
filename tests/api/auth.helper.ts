import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export const LOGIN_PATH = '/api/login';

export const VALID_CREDENTIALS = {
	email: 'testautomation@mailsac.com',
	password: 'Password',
};

export const DISABLED_CREDENTIALS = {
	email: 'disabledaccount@mailsac.com',
	password: 'Password',
};

export type LoginCapture = {
	response: APIResponse;
	body: Record<string, any>;
	token: string;
};

function extractToken(body: Record<string, any>): string | null {
	const token = body.token ?? body.access_token ?? body.data?.token ?? body.data?.access_token;
	return typeof token === 'string' && token.length > 0 ? token : null;
}

let cachedToken: string | null = null;

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function logPrettyResponse(
	label: string,
	response: APIResponse,
	rawBody?: string
): Promise<void> {
	const responseBody = rawBody ?? (await response.text());
	const fallback = {
		success: response.ok(),
		statusCode: response.status(),
	};

	try {
		const parsedBody = JSON.parse(responseBody);
		const compact = {
			success:
				typeof parsedBody?.success === 'boolean' ? parsedBody.success : fallback.success,
			statusCode:
				typeof parsedBody?.statusCode === 'number' ? parsedBody.statusCode : fallback.statusCode,
		};

		console.log(`${label} ${JSON.stringify(compact)}`);
		return;
	} catch {
		console.log(`${label} ${JSON.stringify(fallback)}`);
	}
}

async function postLoginWithRetry(
	request: APIRequestContext,
	data: Record<string, string>
): Promise<Awaited<ReturnType<APIRequestContext['post']>>> {
	let response = await postLogin(request, data);

	for (let attempt = 1; response.status() === 429 && attempt <= 6; attempt++) {
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


async function loginAndStoreToken(request: APIRequestContext): Promise<LoginCapture> {
	const response = await postLoginWithRetry(request, VALID_CREDENTIALS);

	expect(response.status()).toBe(200);

	const body = await response.json();
	const token = extractToken(body);

	expect(token, `Expected auth token in login response: ${JSON.stringify(body)}`).toBeTruthy();

	cachedToken = token as string;
	return {
		response,
		body,
		token: cachedToken,
	};
}

export async function getCachedLoginToken(request: APIRequestContext): Promise<string> {
	if (cachedToken) {
		return cachedToken;
	}

	const capture = await loginAndStoreToken(request);
	return capture.token;
}

export async function getFreshLoginToken(request: APIRequestContext): Promise<string> {
	cachedToken = null;
	const capture = await loginAndStoreToken(request);
	return capture.token;
}

export async function loginAndCaptureToken(request: APIRequestContext): Promise<LoginCapture> {
	cachedToken = null;
	return loginAndStoreToken(request);
}

export function clearCachedLoginToken(): void {
	cachedToken = null;
}

export async function loginAndGetToken(
	request: APIRequestContext,
	options: { refresh?: boolean } = {}
): Promise<string> {
	if (!options.refresh && cachedToken) {
		return cachedToken;
	}

	const capture = await loginAndStoreToken(request);
	return capture.token;
}
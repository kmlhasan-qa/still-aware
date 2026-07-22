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

export async function loginAndGetToken(request: APIRequestContext): Promise<string> {
	const response = await request.post(LOGIN_PATH, {
		data: VALID_CREDENTIALS,
	});

	expect(response.status()).toBe(200);

	const body = await response.json();
	const token = extractToken(body);

	expect(token, `Expected auth token in login response: ${JSON.stringify(body)}`).toBeTruthy();

	return token as string;
}
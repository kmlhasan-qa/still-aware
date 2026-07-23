import { expect, test } from '@playwright/test';
import { getCachedLoginToken } from '../auth.helper';

const LOGOUT_PATH = '/api/logout';

test.describe('POST /api/logout', () => {
	test('200: success after valid login', async ({ request }) => {
		const token = await getCachedLoginToken(request);

		const response = await request.post(LOGOUT_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		expect(response.status()).toBe(200);

		const body = await response.json();
		expect(body).toBeTruthy();
	});

	test('401: unauthenticated without token', async ({ request }) => {
		test.fail(true, 'Known backend bug: unauthenticated logout currently returns 500 Route [login] not defined instead of 401.');

		const response = await request.post(LOGOUT_PATH);

		expect(response.status()).toBe(401);
	});
});

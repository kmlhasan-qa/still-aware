import { expect, test } from '@playwright/test';
import { getFreshLoginToken } from '../helpers/auth.helper';

const USER_PATH = '/api/user';

test.describe('GET /api/user', () => {
	test('200: success with valid token', async ({ request }) => {
		const token = await getFreshLoginToken(request);

		const response = await request.get(USER_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		expect(response.status()).toBe(200);

		const body = await response.json();
		expect(body).toBeTruthy();
	});

	test('401: unauthenticated without token', async ({ request }) => {

		const response = await request.get(USER_PATH, {
			headers: {
				Accept: 'application/json',
			},
		});

		expect(response.status()).toBe(401);
	});
});

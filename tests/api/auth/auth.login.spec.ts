import { expect, test } from '@playwright/test';
import {
	DISABLED_CREDENTIALS,
	postLogin,
	getFreshLoginToken,
	VALID_CREDENTIALS,
} from '../auth.helper';

test.describe('POST /api/login', () => {
	test('200: success with valid credentials', async ({ request }) => {
		const token = await getFreshLoginToken(request);

		expect(token).toBeTruthy();
	});

	test('401: invalid credentials', async ({ request }) => {
		const response = await postLogin(request, {
			email: VALID_CREDENTIALS.email,
			password: 'WrongPassword',
		});

		expect(response.status()).toBe(401);
	});

	test('403: this account has been disabled', async ({ request }) => {
		const response = await postLogin(request, DISABLED_CREDENTIALS);

		expect(response.status()).toBe(403);
	});

	test('422: validation error', async ({ request }) => {
		const response = await postLogin(request, {
			email: '',
			password: '',
		});

		expect(response.status()).toBe(422);
	});
});

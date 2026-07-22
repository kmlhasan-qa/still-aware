import { expect, test } from '@playwright/test';

const LOGIN_PATH = '/api/login';

const VALID_CREDENTIALS = {
	email: 'testautomation@mailsac.com',
	password: 'Password',
};

test.describe('POST /api/login', () => {
	test('200: success with valid credentials', async ({ request }) => {
		const response = await request.post(LOGIN_PATH, {
			data: VALID_CREDENTIALS,
		});

		expect(response.status()).toBe(200);

		const body = await response.json();
		expect(body).toBeTruthy();
	});

	test('401: invalid credentials', async ({ request }) => {
		const response = await request.post(LOGIN_PATH, {
			data: {
				email: VALID_CREDENTIALS.email,
				password: 'WrongPassword',
			},
		});

		expect(response.status()).toBe(401);
	});

	test('422: validation error', async ({ request }) => {
		const response = await request.post(LOGIN_PATH, {
			data: {
				email: '',
				password: '',
			},
		});

		expect(response.status()).toBe(422);
	});
});

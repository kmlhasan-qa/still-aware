import { expect, test } from '@playwright/test';
import { postLogin } from '../auth.helper';

test.describe('POST /api/login rate limiting', () => {
	test('429: too many login attempts after repeated requests', async ({ request }) => {
		let response;

		for (let attempt = 1; attempt <= 12; attempt++) {
			response = await postLogin(request);

			if (response.status() === 429) {
				break;
			}
		}

		expect(response?.status()).toBe(429);
	});
});
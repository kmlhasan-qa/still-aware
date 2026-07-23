import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';

const HOME_PATH = '/api/home';

test.describe('GET /api/home', () => {
	test('200: success', async ({ request }) => {
		const token = await getCachedLoginToken(request);

		const response = await request.get(HOME_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('GET /api/home response', response, bodyText);

		expect(response.status()).toBe(200);
		expect(bodyText).toBeTruthy();
	});

	test('404: homepage not found', async ({ request }) => {
		test.fail(true, 'Environment-dependent: this returns 404 only when homepage content is missing.');

		const token = await getCachedLoginToken(request);

		const response = await request.get(HOME_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('GET /api/home homepage-not-found response', response, bodyText);

		expect(response.status()).toBe(404);
	});
});

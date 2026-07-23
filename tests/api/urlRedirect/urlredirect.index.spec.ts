import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';

const REDIRECTS_PATH = '/api/redirects';

test.describe('GET /api/redirects', () => {
	test('200: success', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const response = await request.get(REDIRECTS_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('GET /api/redirects response', response, bodyText);

		expect(response.status()).toBe(200);
		expect(bodyText).toBeTruthy();
	});
});

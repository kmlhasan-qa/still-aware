import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../auth.helper';

const CMS_PATH = '/api/cms';

test.describe('GET /api/cms', () => {
	test('200: success with valid token', async ({ request }) => {
		const token = await getCachedLoginToken(request);

		const response = await request.get(CMS_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('GET /api/cms response', response, bodyText);

		expect(response.status()).toBe(200);
		expect(bodyText).toBeTruthy();
	});
});

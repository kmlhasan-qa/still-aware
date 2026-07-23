import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';

const MESSAGE_INDEX_PATH = '/api/messages';

test.describe('GET /api/messages', () => {
	test('200: success with cached login token', async ({ request }) => {
		const token = await getCachedLoginToken(request);

		const response = await request.get(MESSAGE_INDEX_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('GET /api/messages response', response, bodyText);

		expect(response.status()).toBe(200);
		expect(bodyText).toBeTruthy();

		const body = JSON.parse(bodyText) as {
			data?: unknown;
		};

		expect(Array.isArray(body.data)).toBe(true);
	});
});

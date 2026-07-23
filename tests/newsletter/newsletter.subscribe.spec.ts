import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../api/helpers/auth.helper';

const NEWSLETTER_SUBSCRIBE_PATH = '/api/newsletter/subscribe';

function buildSeededEmail(): string {
	const seed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
	return `newsletter.${seed}@example.com`;
}

test.describe('POST /api/newsletter/subscribe', () => {
	test('200: success with seeded email', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const response = await request.post(NEWSLETTER_SUBSCRIBE_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			data: {
				email: buildSeededEmail(),
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('POST /api/newsletter/subscribe success response', response, bodyText);

		expect(response.status()).toBe(200);
		expect(bodyText).toBeTruthy();
	});

	test('422: validation error with empty email', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const response = await request.post(NEWSLETTER_SUBSCRIBE_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			data: {
				email: '',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('POST /api/newsletter/subscribe validation response', response, bodyText);

		expect(response.status()).toBe(422);

		const body = JSON.parse(bodyText) as {
			success?: boolean;
			statusCode?: number;
			errors?: Record<string, string[]>;
		};

		expect(body.success).toBe(false);
		expect(body.statusCode).toBe(422);
		expect(body.errors?.email?.length ?? 0).toBeGreaterThan(0);
	});
});

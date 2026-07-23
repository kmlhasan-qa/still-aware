import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';

const DONATION_PAYPAL_SETUP_TOKEN_PATH = '/api/donations/paypal/setup-token';

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function postPaypalSetupTokenWithRetry(
	request: Parameters<typeof test>[0] extends never ? never : any,
	token: string
) {
	let response = await request.post(DONATION_PAYPAL_SETUP_TOKEN_PATH, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json',
		},
	});

	for (let attempt = 1; response.status() === 429 && attempt <= 6; attempt++) {
		await delay(5000);
		response = await request.post(DONATION_PAYPAL_SETUP_TOKEN_PATH, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});
	}

	return response;
}

test.describe('POST /api/donations/paypal/setup-token', () => {
	test('200: success', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const response = await postPaypalSetupTokenWithRetry(request, token);

		const bodyText = await response.text();
		await logPrettyResponse('POST /api/donations/paypal/setup-token response', response, bodyText);

		expect(response.status()).toBe(200);
		expect(bodyText).toBeTruthy();

		const body = JSON.parse(bodyText) as {
			data?: {
				clientSecret?: unknown;
			};
		};

		expect(typeof body.data?.clientSecret).toBe('string');
		expect((body.data?.clientSecret as string).length).toBeGreaterThan(0);
	});
});

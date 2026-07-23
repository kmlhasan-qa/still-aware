import { expect, test } from '@playwright/test';
import { randomUUID } from 'crypto';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';
import { getLatestDonationOrder } from '../helpers/donations.helper';

const ORDER_PATH = '/api/orders';

function buildOrderPath(orderId: string): string {
	return `${ORDER_PATH}/${orderId}`;
}

test.describe('GET /api/orders/{order}', () => {
	test('200: success', async ({ request }) => {
		const orderUuid = getLatestDonationOrder('oneOff');
		test.skip(!orderUuid, 'Run donations.oneoff.spec.ts first to store the latest one-off order UUID.');

		const token = await getCachedLoginToken(request);
		const response = await request.get(buildOrderPath(orderUuid as string), {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse(`GET /api/orders/${orderUuid} success response`, response, bodyText);

		expect(response.status()).toBe(200);
		expect(bodyText).toBeTruthy();
	});

	test('404: not found', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const response = await request.get(buildOrderPath(randomUUID()), {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse('GET /api/orders/{order} not-found response', response, bodyText);

		expect(response.status()).toBe(404);
		expect(bodyText).toBeTruthy();
	});
});

import { expect, test } from '@playwright/test';
import { randomUUID } from 'crypto';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';
import { saveLatestDonationOrderFromBody } from '../helpers/donations.helper';

const DONATION_RECURRING_CHECKOUT_PATH = '/api/donations/recurring/checkout';
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY;

type DonationRecurringCheckoutPayload = {
	amount: number;
	donorFirstName: string;
	donorLastName: string;
	donorEmail: string;
	donorPhone: string;
	donorAddress: string;
	donorCity: string;
	donorPostcode: string;
	provider: 'paypal';
	onBehalf: string;
	notes: string;
	signUpNewsletter: boolean;
	keepMeUpdated: boolean;
	paymentMethod: 'card';
	vaultToken: string;
};

function generateIdempotencyKey(): string {
	return randomUUID();
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function buildRecurringCheckoutPayload(): DonationRecurringCheckoutPayload {
	return {
		amount: 5000,
		donorFirstName: 'Automation',
		donorLastName: 'Recurring',
		donorEmail: 'automationrecurring@example.com',
		donorPhone: '+61 412 345 678',
		donorAddress: '123 Main Street',
		donorCity: 'Sydney',
		donorPostcode: '2000',
		provider: 'paypal',
		onBehalf: 'Acme Corporation',
		notes: 'In memory of John Smith',
		signUpNewsletter: true,
		keepMeUpdated: false,
		paymentMethod: 'card',
		vaultToken: '1A2B3C4D5E6F7G8H',
	};
}

function buildInvalidRecurringCheckoutPayload(): DonationRecurringCheckoutPayload {
	return {
		...buildRecurringCheckoutPayload(),
		donorFirstName: '',
	};
}

async function postRecurringCheckoutWithRetry(
	request: Parameters<typeof test>[0] extends never ? never : any,
	headers: Record<string, string>,
	payload: DonationRecurringCheckoutPayload = buildRecurringCheckoutPayload()
) {
	let response = await request.post(DONATION_RECURRING_CHECKOUT_PATH, {
		headers,
		data: payload,
	});

	for (let attempt = 1; response.status() === 429 && attempt <= 6; attempt++) {
		await delay(5000);
		response = await request.post(DONATION_RECURRING_CHECKOUT_PATH, {
			headers: {
				...headers,
				'Idempotency-Key': generateIdempotencyKey(),
			},
			data: payload,
		});
	}

	return response;
}

test.describe('POST /api/donations/recurring/checkout', () => {
	test('200: success (requires PayPal secret key)', async ({ request }) => {
		test.skip(!PAYPAL_SECRET_KEY, 'Set PAYPAL_SECRET_KEY to run the 200 scenario.');

		const token = await getCachedLoginToken(request);
		const response = await postRecurringCheckoutWithRetry(request, {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'Idempotency-Key': generateIdempotencyKey(),
			'X-PayPal-Secret-Key': PAYPAL_SECRET_KEY as string,
		});

		const bodyText = await response.text();
		await logPrettyResponse('POST /api/donations/recurring/checkout success response', response, bodyText);
		const orderUuid = saveLatestDonationOrderFromBody('recurring', bodyText);

		expect(response.status()).toBe(200);
		expect(orderUuid).toBeTruthy();
		expect(bodyText).toBeTruthy();
	});
});

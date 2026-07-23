import { expect, test } from '@playwright/test';
import { randomUUID } from 'crypto';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';
import { saveLatestDonationOrderFromBody } from '../helpers/donations.helper';

const DONATION_ONE_OFF_INTENT_PATH = '/api/donations/one-off/intent';
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY;

type DonationOneOffIntentPayload = {
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

function buildOneOffIntentPayload(): DonationOneOffIntentPayload {
	return {
		amount: 5000,
		donorFirstName: 'Automation',
		donorLastName: 'One-Off',
		donorEmail: 'automationoneoff@example.com',
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

function buildInvalidOneOffIntentPayload(): DonationOneOffIntentPayload {
	return {
		...buildOneOffIntentPayload(),
		donorFirstName: '',
	};
}

async function postOneOffDonationIntentWithRetry(
	request: Parameters<typeof test>[0] extends never ? never : any,
	token: string,
	headers: Record<string, string>
) {
	let response = await request.post(DONATION_ONE_OFF_INTENT_PATH, {
		headers,
		data: buildOneOffIntentPayload(),
	});

	for (let attempt = 1; response.status() === 429 && attempt <= 4; attempt++) {
		await delay(5000);
		response = await request.post(DONATION_ONE_OFF_INTENT_PATH, {
			headers: {
				...headers,
				'Idempotency-Key': generateIdempotencyKey(),
			},
			data: buildOneOffIntentPayload(),
		});
	}

	return response;
}

test.describe('POST /api/donations/one-off/intent', () => {
	test('200: success (requires PayPal secret key)', async ({ request }) => {
		test.skip(!PAYPAL_SECRET_KEY, 'Set PAYPAL_SECRET_KEY to run the 200 scenario.');

		const token = await getCachedLoginToken(request);
		const response = await postOneOffDonationIntentWithRetry(request, token, {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'Idempotency-Key': generateIdempotencyKey(),
			'X-PayPal-Secret-Key': PAYPAL_SECRET_KEY as string,
		});

		const bodyText = await response.text();
		await logPrettyResponse('POST /api/donations/one-off/intent success response', response, bodyText);
		const orderUuid = saveLatestDonationOrderFromBody('oneOff', bodyText);

		expect(response.status()).toBe(200);
		expect(orderUuid).toBeTruthy();
		expect(bodyText).toBeTruthy();
	});
});

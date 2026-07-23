import { expect, test } from '@playwright/test';
import { logPrettyResponse } from '../helpers/auth.helper';

const MESSAGE_STORE_PATH = '/api/messages';

type MessageStorePayload = {
	name: string;
	email: string;
	phoneNumber: string;
	subject: string;
	comment: string;
};

function buildRandomMessagePayload(): MessageStorePayload {
	const seed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

	return {
		name: `Automation ${seed}`,
		email: `automation.${seed}@example.com`,
		phoneNumber: `+61 4${seed.replace(/\D/g, '').slice(-8).padStart(8, '0')}`,
		subject: `Subject ${seed}`,
		comment: `Comment ${seed}`,
	};
}

function buildInvalidMessagePayload(): MessageStorePayload {
	return {
		name: '',
		email: '',
		phoneNumber: '',
		subject: '',
		comment: '',
	};
}

test.describe('POST /api/messages', () => {
	test('201: success with randomized payload', async ({ request }) => {
		const response = await request.post(MESSAGE_STORE_PATH, {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			data: buildRandomMessagePayload(),
		});

		const bodyText = await response.text();
		await logPrettyResponse('POST /api/messages success response', response, bodyText);

		expect(response.status()).toBe(201);
		expect(bodyText).toBeTruthy();
	});

	test('422: validation error with empty required fields', async ({ request }) => {
		const response = await request.post(MESSAGE_STORE_PATH, {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			data: buildInvalidMessagePayload(),
		});

		const bodyText = await response.text();
		await logPrettyResponse('POST /api/messages validation response', response, bodyText);

		expect(response.status()).toBe(422);

		const body = JSON.parse(bodyText) as {
			success?: boolean;
			statusCode?: number;
			errors?: Record<string, string[]>;
		};

		expect(body.success).toBe(false);
		expect(body.statusCode).toBe(422);
		expect(body.errors?.name?.length ?? 0).toBeGreaterThan(0);
		expect(body.errors?.email?.length ?? 0).toBeGreaterThan(0);
		expect(body.errors?.phoneNumber?.length ?? 0).toBeGreaterThan(0);
		expect(body.errors?.subject?.length ?? 0).toBeGreaterThan(0);
		expect(body.errors?.comment?.length ?? 0).toBeGreaterThan(0);
	});
});

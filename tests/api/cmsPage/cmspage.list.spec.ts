import { expect, test } from '@playwright/test';
import { logPrettyResponse } from '../helpers/auth.helper';
import { fetchCmsListAndStoreSlugs } from '../helpers/cms.helper';

test.describe('GET /api/cms', () => {
	test('200: success with valid token', async ({ request }) => {
		const result = await fetchCmsListAndStoreSlugs(request);

		await logPrettyResponse('GET /api/cms response', result.response, result.bodyText);

		expect(result.status).toBe(200);
		expect(result.bodyText).toBeTruthy();
		expect(result.slugs.length).toBeGreaterThan(0);
	});
});

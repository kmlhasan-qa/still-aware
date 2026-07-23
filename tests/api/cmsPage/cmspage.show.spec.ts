import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../helpers/auth.helper';
import { getStoredCmsSlugsOrFetch } from '../helpers/cms.helper';

const CMS_SHOW_PATH = '/api/cms';

test.describe('GET /api/cms/{slug}', () => {
	test('200: success for all slugs from cms list', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const slugs = await getStoredCmsSlugsOrFetch(request);

		expect(slugs.length).toBeGreaterThan(0);

		for (const slug of slugs) {
			const response = await request.get(`${CMS_SHOW_PATH}/${slug}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
				},
			});

			const bodyText = await response.text();
			await logPrettyResponse(`GET /api/cms/${slug} response`, response, bodyText);

			expect(response.status(), `Expected 200 for slug: ${slug}`).toBe(200);
			expect(bodyText).toBeTruthy();
		}
	});

	test('404: no query results for unknown slug', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const unknownSlug = `unknown-slug-${Date.now()}`;

		const response = await request.get(`${CMS_SHOW_PATH}/${unknownSlug}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		const bodyText = await response.text();
		await logPrettyResponse(`GET /api/cms/${unknownSlug} response`, response, bodyText);

		expect(response.status()).toBe(404);
		expect(bodyText).toBeTruthy();
	});
});

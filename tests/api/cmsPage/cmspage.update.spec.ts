import { expect, test } from '@playwright/test';
import { getCachedLoginToken, logPrettyResponse } from '../auth.helper';
import { getStoredCmsSlugsOrFetch } from './cmspage.helper';

const CMS_PATH = '/api/cms';

type CmsShowResponse = {
	data?: Record<string, unknown>;
};

function buildSafeUpdatePayload(source: Record<string, unknown>): Record<string, unknown> {
	// Keep PATCH non-destructive by only sending unchanged scalar fields.
	const title = source.title;

	if (typeof title === 'string') {
		return { title };
	}

	return {};
}

async function fetchCurrentCmsPayload(
	request: Parameters<typeof test>[0] extends never ? never : any,
	token: string,
	slug: string
): Promise<Record<string, unknown>> {
	const showResponse = await request.get(`${CMS_PATH}/${slug}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json',
		},
	});

	const showBodyText = await showResponse.text();
	await logPrettyResponse(`GET /api/cms/${slug} before update`, showResponse, showBodyText);

	expect(showResponse.status(), `Expected 200 when reading slug before patch: ${slug}`).toBe(200);

	const parsed = JSON.parse(showBodyText) as CmsShowResponse | Record<string, unknown>;
	const source = (
		(parsed as CmsShowResponse).data && typeof (parsed as CmsShowResponse).data === 'object'
			? (parsed as CmsShowResponse).data
			: parsed
	) as Record<string, unknown>;

	return buildSafeUpdatePayload(source);
}

test.describe('PATCH /api/cms/{slug}', () => {
	test('200: success updating all slugs with unchanged content', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const slugs = await getStoredCmsSlugsOrFetch(request);

		expect(slugs.length).toBeGreaterThan(0);

		for (const slug of slugs) {
			const payload = await fetchCurrentCmsPayload(request, token, slug);

			const patchResponse = await request.patch(`${CMS_PATH}/${slug}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
				},
				data: payload,
			});

			const patchBodyText = await patchResponse.text();
			await logPrettyResponse(`PATCH /api/cms/${slug} response`, patchResponse, patchBodyText);

			expect(patchResponse.status(), `Expected 200 for slug: ${slug}`).toBe(200);
		}
	});

	test('401: unauthenticated without token', async ({ request }) => {
		const slugs = await getStoredCmsSlugsOrFetch(request);
		const slug = slugs[0];

		expect(slug).toBeTruthy();

		const patchResponse = await request.patch(`${CMS_PATH}/${slug}`, {
			headers: {
				Accept: 'application/json',
			},
			data: {},
		});

		const patchBodyText = await patchResponse.text();
		await logPrettyResponse(`PATCH /api/cms/${slug} unauthenticated response`, patchResponse, patchBodyText);

		expect(patchResponse.status()).toBe(401);
	});

	test('403: authorization error', async ({ request }) => {
		test.fail(true, 'Environment-dependent: this may require a lower-privilege account to return 403.');

		const token = await getCachedLoginToken(request);
		const slugs = await getStoredCmsSlugsOrFetch(request);
		const slug = slugs[0];

		expect(slug).toBeTruthy();

		const patchResponse = await request.patch(`${CMS_PATH}/${slug}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
			data: {
				title: '',
			},
		});

		const patchBodyText = await patchResponse.text();
		await logPrettyResponse(`PATCH /api/cms/${slug} authorization response`, patchResponse, patchBodyText);

		expect(patchResponse.status()).toBe(403);
	});

	test('422: validation error', async ({ request }) => {
		const token = await getCachedLoginToken(request);
		const slugs = await getStoredCmsSlugsOrFetch(request);
		const slug = slugs[0];

		expect(slug).toBeTruthy();

		const patchResponse = await request.patch(`${CMS_PATH}/${slug}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
			data: {
				title: '',
			},
		});

		const patchBodyText = await patchResponse.text();
		await logPrettyResponse(`PATCH /api/cms/${slug} validation response`, patchResponse, patchBodyText);

		expect(patchResponse.status()).toBe(422);
	});
});

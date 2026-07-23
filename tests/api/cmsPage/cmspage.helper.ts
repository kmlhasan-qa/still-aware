import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { getCachedLoginToken } from '../auth.helper';

const CMS_PATH = '/api/cms';

let storedCmsSlugs: string[] = [];

type CmsListItem = {
	slug?: unknown;
};

type CmsListResponse = {
	data?: unknown;
};

function extractSlugs(body: CmsListResponse): string[] {
	if (!Array.isArray(body.data)) return [];

	return body.data
		.map((item: CmsListItem) => item?.slug)
		.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0);
}

export async function fetchCmsListAndStoreSlugs(request: APIRequestContext): Promise<{
	response: APIResponse;
	status: number;
	bodyText: string;
	slugs: string[];
}> {
	const token = await getCachedLoginToken(request);

	const response = await request.get(CMS_PATH, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json',
		},
	});

	const bodyText = await response.text();
	const parsed = JSON.parse(bodyText) as CmsListResponse;
	storedCmsSlugs = extractSlugs(parsed);

	return {
		response,
		status: response.status(),
		bodyText,
		slugs: [...storedCmsSlugs],
	};
}

export async function getStoredCmsSlugsOrFetch(request: APIRequestContext): Promise<string[]> {
	if (storedCmsSlugs.length > 0) {
		return [...storedCmsSlugs];
	}

	const result = await fetchCmsListAndStoreSlugs(request);
	return result.slugs;
}

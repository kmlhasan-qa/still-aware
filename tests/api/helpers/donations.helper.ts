import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

type DonationOrderKind = 'oneOff' | 'recurring';

type DonationOrderStore = {
	oneOff?: string;
	recurring?: string;
};

const ORDER_STORE_PATH = path.resolve(process.cwd(), 'test-results', 'donations.latest-orders.json');

function readDonationOrderStore(): DonationOrderStore {
	if (!existsSync(ORDER_STORE_PATH)) {
		return {};
	}

	try {
		const content = readFileSync(ORDER_STORE_PATH, 'utf8');
		return JSON.parse(content) as DonationOrderStore;
	} catch {
		return {};
	}
}

function writeDonationOrderStore(store: DonationOrderStore): void {
	mkdirSync(path.dirname(ORDER_STORE_PATH), { recursive: true });
	writeFileSync(ORDER_STORE_PATH, JSON.stringify(store, null, 2));
}

export function extractOrderUuidFromBody(bodyText: string): string | null {
	try {
		const parsed = JSON.parse(bodyText) as { data?: { orderUuid?: unknown } };
		const orderUuid = parsed.data?.orderUuid;

		return typeof orderUuid === 'string' && orderUuid.length > 0 ? orderUuid : null;
	} catch {
		return null;
	}
}

export function saveLatestDonationOrder(kind: DonationOrderKind, orderUuid: string): void {
	const store = readDonationOrderStore();
	store[kind] = orderUuid;
	writeDonationOrderStore(store);
}

export function saveLatestDonationOrderFromBody(kind: DonationOrderKind, bodyText: string): string | null {
	const orderUuid = extractOrderUuidFromBody(bodyText);

	if (!orderUuid) {
		return null;
	}

	saveLatestDonationOrder(kind, orderUuid);
	return orderUuid;
}

export function getLatestDonationOrder(kind: DonationOrderKind): string | null {
	const store = readDonationOrderStore();
	const orderUuid = store[kind];

	return typeof orderUuid === 'string' && orderUuid.length > 0 ? orderUuid : null;
}

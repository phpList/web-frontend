import {
    CampaignClient,
    Client,
    ListMessagesClient,
    ListClient,
    StatisticsClient,
    SubscribersClient,
    SubscriptionClient,
    SubscriberAttributesClient,
    TemplatesClient
} from '@tatevikgr/rest-api-client';

const appElement = document.getElementById('vue-app');
const apiToken = appElement?.dataset.apiToken;
const apiBaseUrl = appElement?.dataset.apiBaseUrl;

if (!apiBaseUrl) {
    console.error('API Base URL is not configured.');
}

const client = new Client(apiBaseUrl || '');

if (apiToken) {
    client.setSessionId(apiToken);
}

export const subscribersClient = new SubscribersClient(client);
export const listClient = new ListClient(client);
export const campaignClient = new CampaignClient(client);
export const listMessagesClient = new ListMessagesClient(client);
export const statisticsClient = new StatisticsClient(client);
export const subscriptionClient = new SubscriptionClient(client);
export const subscriberAttributesClient = new SubscriberAttributesClient(client);
export const templateClient = new TemplatesClient(client);

export const fetchAllLists = async ({ limit = 100, maxPages = 100 } = {}) => {
    const lists = [];
    let afterId = null;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
        const response = await listClient.getLists(afterId, limit);
        const items = Array.isArray(response?.items) ? response.items : [];
        lists.push(...items);

        const hasMore = response?.pagination?.hasMore === true;
        const nextCursor = response?.pagination?.nextCursor;

        if (!hasMore || !Number.isFinite(nextCursor) || nextCursor === afterId) {
            break;
        }

        afterId = nextCursor;
    }

    return lists;
};

export const fetchAllBounces = async ({ limit = 100, maxPages = 100 } = {}) => {
    const bounces = [];
    let afterId = null;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
        const query = { limit };
        if (afterId !== null) {
            query.after_id = afterId;
        }

        const response = await client.get('bounces', query);
        const items = Array.isArray(response?.items) ? response.items : [];
        bounces.push(...items);

        const pagination = response?.pagination ?? {};
        const hasMore = pagination.hasMore === true || pagination.has_more === true;
        const nextCursor = pagination.nextCursor ?? pagination.next_cursor ?? null;

        if (!hasMore || !Number.isFinite(nextCursor) || nextCursor === afterId) {
            break;
        }

        afterId = nextCursor;
    }

    bounces.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
    return bounces;
};

export default client;

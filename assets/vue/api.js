import {
    CampaignClient,
    Client,
    ListMessagesClient,
    ListClient,
    StatisticsClient,
    SubscribersClient,
    SubscriptionClient,
    SubscriberAttributesClient,
    TemplatesClient,
    BouncesClient,
} from '@tatevikgr/rest-api-client';

const AUTHENTICATION_REDIRECT_PATH = '/login';
let isAuthenticationRedirectInProgress = false;

const isAuthenticationError = (error) =>
    error?.name === 'AuthenticationException'
    || error?.status === 401
    || error?.response?.status === 401;

const redirectToLogin = () => {
    if (typeof window === 'undefined') {
        return;
    }
    if (window.location.pathname === AUTHENTICATION_REDIRECT_PATH || isAuthenticationRedirectInProgress) {
        return;
    }
    isAuthenticationRedirectInProgress = true;
    window.location.href = AUTHENTICATION_REDIRECT_PATH;
};

const appElement = document.getElementById('vue-app');
const apiToken = appElement?.dataset.apiToken;
const apiBaseUrl = appElement?.dataset.apiBaseUrl;

if (!apiBaseUrl) {
    console.error('API Base URL is not configured.');
}

const client = new Client(apiBaseUrl || '', {
    onAuthenticationError: redirectToLogin,
    onAuthorizationError: redirectToLogin,
});

if (apiToken) {
    client.setSessionId(apiToken);
}

client.axiosInstance?.interceptors?.response?.use(
    (response) => response,
    (error) => {
        if (isAuthenticationError(error)) {
            redirectToLogin();
        }

        return Promise.reject(error);
    }
);

export const subscribersClient = new SubscribersClient(client);
export const listClient = new ListClient(client);
export const campaignClient = new CampaignClient(client);
export const listMessagesClient = new ListMessagesClient(client);
export const statisticsClient = new StatisticsClient(client);
export const subscriptionClient = new SubscriptionClient(client);
export const subscriberAttributesClient = new SubscriberAttributesClient(client);
export const templateClient = new TemplatesClient(client);
export const bouncesClient = new BouncesClient(client);

export const backendFetch = async (input, init = undefined) => {
    const response = await fetch(input, init);

    if (response.status === 401) {
        redirectToLogin();
    }

    return response;
};

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

export default client;

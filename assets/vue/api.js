import {
    AdminClient,
    CampaignClient,
    Client,
    ListMessagesClient,
    ListClient,
    StatisticsClient,
    SubscribePagesClient,
    SubscribersClient,
    SubscriptionClient,
    SubscriberAttributesClient,
    TemplatesClient,
    BouncesClient,
    ConfigClient,
    AdminAttributeClient,
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
    const redirectTarget = `${window.location.pathname}${window.location.search}`;
    const search = new URLSearchParams({ redirect: redirectTarget }).toString();
    window.location.href = `${AUTHENTICATION_REDIRECT_PATH}?${search}`;
};

const appElement = document.getElementById('vue-app');
const apiToken = appElement?.dataset.apiToken;
const apiElement = document.getElementById('api-config');
const apiBaseUrl = apiElement?.dataset.apiBaseUrl;

if (!apiBaseUrl) {
    console.error('API Base URL is not configured.');
}

const client = new Client(apiBaseUrl || '', {
    onAuthenticationError: redirectToLogin,
    timeout: 90000,
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
export const adminClient = new AdminClient(client);
export const adminAttributeClient = new AdminAttributeClient(client);
export const listClient = new ListClient(client);
export const campaignClient = new CampaignClient(client);
export const listMessagesClient = new ListMessagesClient(client);
export const statisticsClient = new StatisticsClient(client);
export const subscriptionClient = new SubscriptionClient(client);
export const subscribePagesClient = new SubscribePagesClient(client);
export const subscriberAttributesClient = new SubscriberAttributesClient(client);
export const templateClient = new TemplatesClient(client);
export const bouncesClient = new BouncesClient(client);
export const configClient = new ConfigClient(client);

// Requests to the PHP backend are run one at a time: the shared PHP session is not safe against
// concurrent requests (one can read it mid-write, see no auth token and answer 401, which sends
// the user back to the login page).
let backendQueue = Promise.resolve()

// Upper bound for a queued request to receive its response headers. Without it a stalled request
// would block every request queued behind it.
const BACKEND_FETCH_TIMEOUT_MS = 90000

export const backendFetch = (input, init = undefined) => {
    const run = async () => {
        const callerSignal = init?.signal
        const controller = new AbortController()
        let onCallerAbort = null

        if (callerSignal) {
            if (callerSignal.aborted) {
                controller.abort(callerSignal.reason)
            } else {
                onCallerAbort = () => controller.abort(callerSignal.reason)
                callerSignal.addEventListener('abort', onCallerAbort, { once: true })
            }
        }

        const timer = setTimeout(() => {
            controller.abort(new DOMException('Request timed out', 'TimeoutError'))
        }, BACKEND_FETCH_TIMEOUT_MS)

        try {
            const response = await fetch(input, { ...init, signal: controller.signal })

            if (response.status === 401) {
                redirectToLogin()
            }

            // The caller's abort listener stays attached on success so that cancelling still
            // aborts the response body while it is being read.
            return response
        } catch (error) {
            if (onCallerAbort) {
                callerSignal.removeEventListener('abort', onCallerAbort)
            }
            throw error
        } finally {
            clearTimeout(timer)
        }
    }
    const result = backendQueue.then(run, run)
    backendQueue = result.catch(() => {})

    return result
}

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

export const fetchAllAdmins = async ({ limit = 100, maxPages = 100 } = {}) => {
    const admins = [];
    let afterId = null;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
        const response = await adminClient.getAdministrators(afterId, limit);
        const items = Array.isArray(response?.items) ? response.items : [];
        admins.push(...items);

        const hasMore = response?.pagination?.hasMore === true;
        const nextCursor = response?.pagination?.nextCursor;

        if (!hasMore || !Number.isFinite(nextCursor) || nextCursor === afterId) {
            break;
        }

        afterId = nextCursor;
    }

    return admins;
};

export const fetchAllAttributeDefinitions = async ({ limit = 100, maxPages = 100 } = {}) => {
    const attributes = [];
    let afterId = null;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
        const response = await subscriberAttributesClient.getAttributeDefinitions(afterId, limit);
        const items = Array.isArray(response?.items) ? response.items : [];
        attributes.push(...items);

        const hasMore = response?.pagination?.hasMore === true;
        const nextCursor = response?.pagination?.nextCursor;

        if (!hasMore || !Number.isFinite(nextCursor) || nextCursor === afterId) {
            break;
        }

        afterId = nextCursor;
    }

    return attributes;
};

export default client;

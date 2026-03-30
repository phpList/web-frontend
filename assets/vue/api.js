import {Client, ListClient, SubscribersClient, SubscriptionClient, SubscriberAttributesClient} from '@tatevikgr/rest-api-client';

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
export const subscriptionClient = new SubscriptionClient(client);
export const subscriberAttributesClient = new SubscriberAttributesClient(client);

export default client;

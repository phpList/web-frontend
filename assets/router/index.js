import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../vue/views/DashboardView.vue'
import SubscribersView from '../vue/views/SubscribersView.vue'
import ListsView from '../vue/views/ListsView.vue'
import ListSubscribersView from '../vue/views/ListSubscribersView.vue'
import CampaignsView from '../vue/views/CampaignsView.vue'
import CampaignEditView from '../vue/views/CampaignEditView.vue'
import TemplatesView from '../vue/views/TemplatesView.vue'
import TemplateEditView from '../vue/views/TemplateEditView.vue'
import BouncesView from '../vue/views/BouncesView.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
        { path: '/subscribers', name: 'subscribers', component: SubscribersView, meta: { title: 'Subscribers' } },
        { path: '/lists', name: 'lists', component: ListsView, meta: { title: 'Lists' } },
        { path: '/campaigns', name: 'campaigns', component: CampaignsView, meta: { title: 'Campaigns' } },
        { path: '/templates', name: 'templates', component: TemplatesView, meta: { title: 'Templates' } },
        { path: '/templates/create', name: 'template-create', component: TemplateEditView, meta: { title: 'Create Template' } },
        { path: '/templates/:templateId/edit', name: 'template-edit', component: TemplateEditView, meta: { title: 'Edit Template' } },
        { path: '/campaigns/create', name: 'campaign-create', component: CampaignEditView, meta: { title: 'Create Campaign' } },
        { path: '/campaigns/:campaignId/edit', name: 'campaign-edit', component: CampaignEditView, meta: { title: 'Edit Campaign' } },
        { path: '/lists/:listId/subscribers', name: 'list-subscribers', component: ListSubscribersView, meta: { title: 'List Subscribers' } },
        { path: '/bounces', name: 'bounces', component: BouncesView, meta: { title: 'Bounces' } },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});

router.afterEach((to) => {
    const defaultTitle = 'phpList';
    const pageTitle = to.meta.title;
    document.title = pageTitle ? `${defaultTitle} - ${pageTitle}` : defaultTitle;
});

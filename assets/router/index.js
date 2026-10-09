import { createRouter, createWebHistory } from 'vue-router';
import { useCurrentAdmin } from '../vue/composables/useCurrentAdmin';

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'dashboard', component: () => import('../vue/views/DashboardView.vue'), meta: { title: 'Dashboard' } },
        { path: '/subscribers', name: 'subscribers', component: () => import('../vue/views/SubscribersView.vue'), meta: { title: 'Subscribers', requiredPrivilege: 'subscribers' } },
        { path: '/lists', name: 'lists', component: () => import('../vue/views/ListsView.vue'), meta: { title: 'Lists' } },
        { path: '/campaigns', name: 'campaigns', component: () => import('../vue/views/CampaignsView.vue'), meta: { title: 'Campaigns', requiredPrivilege: 'campaigns' } },
        { path: '/campaigns/stuck', name: 'stuck-campaigns', component: () => import('../vue/views/StuckCampaignsView.vue'), meta: { title: 'Stuck Campaigns', requiredPrivilege: 'campaigns' } },
        { path: '/templates', name: 'templates', component: () => import('../vue/views/TemplatesView.vue'), meta: { title: 'Templates' } },
        { path: '/templates/create', name: 'template-create', component: () => import('../vue/views/TemplateEditView.vue'), meta: { title: 'Create Template' } },
        { path: '/templates/:templateId/edit', name: 'template-edit', component: () => import('../vue/views/TemplateEditView.vue'), meta: { title: 'Edit Template' } },
        { path: '/campaigns/create', name: 'campaign-create', component: () => import('../vue/views/CampaignEditView.vue'), meta: { title: 'Create Campaign', requiredPrivilege: 'campaigns' } },
        { path: '/campaigns/:campaignId/edit', name: 'campaign-edit', component: () => import('../vue/views/CampaignEditView.vue'), meta: { title: 'Edit Campaign', requiredPrivilege: 'campaigns' } },
        { path: '/lists/:listId/subscribers', name: 'list-subscribers', component: () => import('../vue/views/ListSubscribersView.vue'), meta: { title: 'List Subscribers', requiredPrivilege: 'subscribers' } },
        { path: '/bounces', name: 'bounces', component: () => import('../vue/views/BouncesView.vue'), meta: { title: 'Bounces' } },
        { path: '/analytics', name: 'analytics', component: () => import('../vue/views/AnalyticsView.vue'), meta: { title: 'Analytics', requiredPrivilege: 'statistics' } },
        { path: '/public', name: 'public-pages', component: () => import('../vue/views/PublicPagesView.vue'), meta: { title: 'Public Pages' } },
        { path: '/public/create', name: 'public-page-create', component: () => import('../vue/views/PublicPageEditView.vue'), meta: { title: 'Create Public Page' } },
        { path: '/public/:pageId/edit', name: 'public-page-edit', component: () => import('../vue/views/PublicPageEditView.vue'), meta: { title: 'Edit Public Page' } },
        { path: '/settings', name: 'settings', component: () => import('../vue/views/SettingsView.vue'), meta: { title: 'Settings', requiredPrivilege: 'settings' } },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});

router.beforeEach(async (to) => {
    const requiredPrivilege = to.meta?.requiredPrivilege;
    if (!requiredPrivilege) {
        return true;
    }

    const { loadCurrentAdmin, hasPrivilege } = useCurrentAdmin();
    await loadCurrentAdmin();

    return hasPrivilege(requiredPrivilege) ? true : { path: '/' };
});

router.afterEach((to) => {
    const defaultTitle = 'phpList';
    const pageTitle = to.meta.title;
    document.title = pageTitle ? `${defaultTitle} - ${pageTitle}` : defaultTitle;
});

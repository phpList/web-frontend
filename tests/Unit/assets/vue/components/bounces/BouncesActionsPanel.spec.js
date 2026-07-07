import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import BouncesActionsPanel from '../../../../../../assets/vue/components/bounces/BouncesActionsPanel.vue'

vi.mock('../../../../../../assets/vue/components/bounces/BounceOverview.vue', () => ({ default: { template: '<div data-testid="bounce-overview" />' } }))
vi.mock('../../../../../../assets/vue/components/bounces/BounceRules.vue',    () => ({ default: { template: '<div data-testid="bounce-rules" />' } }))
vi.mock('../../../../../../assets/vue/components/bounces/BouncePer.vue',      () => ({ default: { template: '<div data-testid="bounce-per" />' } }))

const makeRouter = (query = {}) =>
    createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', component: { template: '<div />' } }],
    })

const mountComponent = async (query = {}) => {
    const router = makeRouter()
    await router.push({ path: '/', query })
    await router.isReady()

    const wrapper = mount(BouncesActionsPanel, {
        global: { plugins: [router] },
    })

    await flushPromises()
    return { wrapper, router }
}

describe('initial render', () => {
    it('renders the page heading', async () => {
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('Bounce Management')
    })

    it('renders all four tab buttons', async () => {
        const { wrapper } = await mountComponent()
        const buttons = wrapper.findAll('button[type="button"]')
        const labels = buttons.map((b) => b.text())
        expect(labels).toContain('Overview')
        expect(labels).toContain('Rules')
        expect(labels).toContain('Per List/Campaign')
        expect(labels).toContain('Processing')
    })

    it('defaults to the overview tab when no query param is present', async () => {
        const { wrapper } = await mountComponent()
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(true)
    })

    it('activates the tab matching a valid ?tab= query param', async () => {
        const { wrapper } = await mountComponent({ tab: 'rules' })
        expect(wrapper.find('[data-testid="bounce-rules"]').exists()).toBe(true)
    })

    it('falls back to overview for an unknown ?tab= value', async () => {
        const { wrapper } = await mountComponent({ tab: 'nonexistent' })
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(true)
    })

    it('falls back to overview when tab param is not a string', async () => {
        const { wrapper } = await mountComponent({ tab: undefined })
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(true)
    })
})

describe('tab switching', () => {
    const clickTab = async (wrapper, label) => {
        const btn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes(label))
        await btn.trigger('click')
        await flushPromises()
    }

    it('shows BounceOverview when Overview tab is clicked', async () => {
        const { wrapper } = await mountComponent({ tab: 'rules' })
        await clickTab(wrapper, 'Overview')
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(true)
    })

    it('shows BounceRules when Rules tab is clicked', async () => {
        const { wrapper } = await mountComponent()
        await clickTab(wrapper, 'Rules')
        expect(wrapper.find('[data-testid="bounce-rules"]').exists()).toBe(true)
    })

    it('shows BouncePer when Per List/Campaign tab is clicked', async () => {
        const { wrapper } = await mountComponent()
        await clickTab(wrapper, 'Per List/Campaign')
        expect(wrapper.find('[data-testid="bounce-per"]').exists()).toBe(true)
    })

    it('shows the fallback panel for an unimplemented tab (Processing)', async () => {
        const { wrapper } = await mountComponent()
        await clickTab(wrapper, 'Processing')
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(false)
        expect(wrapper.find('[data-testid="bounce-rules"]').exists()).toBe(false)
        expect(wrapper.text()).toContain('Processing')
    })

    it('only renders one tab panel at a time', async () => {
        const { wrapper } = await mountComponent()
        await clickTab(wrapper, 'Rules')
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(false)
        expect(wrapper.find('[data-testid="bounce-rules"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="bounce-per"]').exists()).toBe(false)
    })
})

describe('active tab styling', () => {
    const getTabBtn = (wrapper, label) =>
        wrapper.findAll('button[type="button"]').find((b) => b.text().includes(label))

    it('applies active classes to the current tab button', async () => {
        const { wrapper } = await mountComponent()
        const overviewBtn = getTabBtn(wrapper, 'Overview')
        expect(overviewBtn.classes()).toContain('bg-white')
        expect(overviewBtn.classes()).toContain('shadow-sm')
    })

    it('does not apply active classes to inactive tab buttons', async () => {
        const { wrapper } = await mountComponent()
        const rulesBtn = getTabBtn(wrapper, 'Rules')
        expect(rulesBtn.classes()).not.toContain('bg-white')
        expect(rulesBtn.classes()).not.toContain('shadow-sm')
    })

    it('moves active styling when a new tab is clicked', async () => {
        const { wrapper } = await mountComponent()
        const rulesBtn = getTabBtn(wrapper, 'Rules')
        await rulesBtn.trigger('click')
        await flushPromises()
        expect(rulesBtn.classes()).toContain('bg-white')
        expect(getTabBtn(wrapper, 'Overview').classes()).not.toContain('bg-white')
    })
})

describe('router sync', () => {
    const clickTab = async (wrapper, label) => {
        const btn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes(label))
        await btn.trigger('click')
        await flushPromises()
    }

    it('updates the URL query param when a tab is clicked', async () => {
        const { wrapper, router } = await mountComponent()
        await clickTab(wrapper, 'Rules')
        expect(router.currentRoute.value.query.tab).toBe('rules')
    })

    it('sets ?tab=overview in the URL on initial load', async () => {
        const { router } = await mountComponent()
        expect(router.currentRoute.value.query.tab).toBe('overview')
    })

    it('preserves other existing query params when switching tabs', async () => {
        const { wrapper, router } = await mountComponent({ tab: 'overview', foo: 'bar' })
        await clickTab(wrapper, 'Rules')
        expect(router.currentRoute.value.query.foo).toBe('bar')
        expect(router.currentRoute.value.query.tab).toBe('rules')
    })

    it('reacts to an external route change and updates the active tab', async () => {
        const { wrapper, router } = await mountComponent()
        await router.replace({ query: { tab: 'per' } })
        await flushPromises()
        expect(wrapper.find('[data-testid="bounce-per"]').exists()).toBe(true)
    })

    it('does not push a duplicate navigation when the route already matches', async () => {
        const { wrapper, router } = await mountComponent({ tab: 'rules' })
        const replaceSpy = vi.spyOn(router, 'replace')
        // navigate to same tab externally
        await router.replace({ query: { tab: 'rules' } })
        await flushPromises()
        await clickTab(wrapper, 'Rules')
        // replace should not have been called again for the same tab
        const callsAfterMount = replaceSpy.mock.calls.filter(
            (call) => call[0]?.query?.tab === 'rules'
        )
        // at most 1 call (the initial immediate watcher), not multiple
        expect(callsAfterMount.length).toBeLessThanOrEqual(1)
    })
})

describe('normalizeTabId', () => {
    it('falls back to overview for an empty string', async () => {
        const { wrapper } = await mountComponent({ tab: '' })
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(true)
    })

    it('falls back to overview for a numeric tab value', async () => {
        const { wrapper } = await mountComponent({ tab: '123' })
        expect(wrapper.find('[data-testid="bounce-overview"]').exists()).toBe(true)
    })

    it('accepts all defined tab ids', async () => {
        for (const tabId of ['overview', 'rules', 'per', 'processing']) {
            const { wrapper } = await mountComponent({ tab: tabId })
            expect(wrapper.find('button.bg-white').text()).toContain(
                tabId === 'overview' ? 'Overview'
                    : tabId === 'rules'   ? 'Rules'
                        : tabId === 'per'     ? 'Per List/Campaign'
                            :                       'Processing'
            )
        }
    })
})

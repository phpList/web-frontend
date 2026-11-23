import { describe, it, expect, vi, beforeEach } from 'vitest'

const backendFetch = vi.fn()

const loadCurrentAdmin = vi.fn()

vi.mock('../../../../../assets/vue/api', () => ({ backendFetch }))
vi.mock('../../../../../assets/vue/composables/useCurrentAdmin', () => ({
    useCurrentAdmin: () => ({ loadCurrentAdmin }),
}))

describe('useCommunityNews', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
        loadCurrentAdmin.mockResolvedValue(undefined)
    })

    const load = async () => {
        const { useCommunityNews } = await import('../../../../../assets/vue/composables/useCommunityNews.js')
        return useCommunityNews()
    }

    it('loads the news items from the backend', async () => {
        backendFetch.mockResolvedValue({ ok: true, json: async () => ({ items: [{ title: 'A', link: 'https://x.test' }] }) })
        const news = await load()

        expect(news.loading.value).toBe(true)
        await news.load()

        expect(backendFetch).toHaveBeenCalledWith('/dashboard/community-news', expect.objectContaining({
            headers: expect.objectContaining({ Accept: 'application/json' }),
        }))
        expect(news.items.value).toHaveLength(1)
        expect(news.loading.value).toBe(false)
        expect(news.error.value).toBe('')
    })

    it('reports an error when the request fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        backendFetch.mockResolvedValue({ ok: false, status: 502 })
        const news = await load()

        await news.load()

        expect(news.items.value).toEqual([])
        expect(news.error.value).toBe('Unable to load community news.')
    })

    it('only fetches once', async () => {
        backendFetch.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) })
        const news = await load()

        await news.load()
        await news.load()

        expect(backendFetch).toHaveBeenCalledTimes(1)
    })

    it('waits for the current admin request before calling the backend', async () => {
        const order = []
        let finishAdmin
        loadCurrentAdmin.mockImplementation(() => new Promise((resolve) => {
            finishAdmin = () => { order.push('admin'); resolve() }
        }))
        backendFetch.mockImplementation(async () => {
            order.push('news')
            return { ok: true, json: async () => ({ items: [] }) }
        })
        const news = await load()

        const pending = news.load()
        await Promise.resolve()
        expect(backendFetch).not.toHaveBeenCalled()

        finishAdmin()
        await pending

        expect(order).toEqual(['admin', 'news'])
    })
})

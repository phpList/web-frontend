import { ref } from 'vue'

// maxPages is a safety net against runaway loops, not a functional cap - it's far above any
// realistic dataset size, and hitting it logs a warning instead of silently truncating results.
const drainPaginated = async (fetchPage, onItems, { limit = 100, maxPages = 500 } = {}) => {
  let cursor = null
  let pages = 0

  while (pages < maxPages) {
    const response = await fetchPage(cursor, limit)
    const items = Array.isArray(response?.items) ? response.items : []
    onItems(items)

    const hasMore = Boolean(response?.pagination?.hasMore)
    const nextCursor = response?.pagination?.nextCursor ?? null
    // A cursor that doesn't advance (server pagination bug) would otherwise spin until maxPages,
    // hammering the API with identical requests - bail out the moment it stops moving forward.
    if (!hasMore || nextCursor === null || nextCursor === cursor) break

    cursor = nextCursor
    pages += 1
  }

  if (pages >= maxPages) {
    console.warn('Pagination guard reached; results may be incomplete.')
  }
}

export function useCampaignStatistics(statisticsClient) {
  const statisticsByCampaignId = ref({})
  const showStatistics = ref(true)

  const getCampaignStatistics = (campaignId) => statisticsByCampaignId.value[campaignId] || {
    bounces: 0,
    sent: 0,
    uniqueViews: 0,
  }

  const fetchCampaignStatistics = async () => {
    try {
      // Independent endpoints - written into separate maps so they can be fetched concurrently
      // without one drain's pagination racing the other's, then merged once both are done.
      const campaignStatsMap = {}
      const viewOpensSentByCampaignId = {}

      await Promise.all([
        drainPaginated(
          (cursor, limit) => statisticsClient.getCampaignStatistics(cursor, limit),
          (items) => {
            items.forEach((item) => {
              campaignStatsMap[item.campaignId] = {
                bounces: Number(item.bounces ?? 0),
                sent: Number(item.sent ?? 0),
                uniqueViews: Number(item.uniqueViews ?? 0),
              }
            })
          },
          { limit: 100 }
        ),
        drainPaginated(
          (cursor, limit) => statisticsClient.getStatisticsOfViewOpens(cursor, limit),
          (items) => {
            items.forEach((item) => {
              viewOpensSentByCampaignId[item.campaignId] = Number(item.sent ?? 0)
            })
          },
          { limit: 100 }
        )
      ])

      const statisticsMap = { ...campaignStatsMap }
      Object.entries(viewOpensSentByCampaignId).forEach(([campaignId, sent]) => {
        const existing = statisticsMap[campaignId] ?? { bounces: 0, sent: 0, uniqueViews: 0 }
        statisticsMap[campaignId] = { ...existing, sent }
      })

      statisticsByCampaignId.value = statisticsMap
      showStatistics.value = true
    } catch (error) {
      if (
          error?.name === 'AuthorizationException' ||
          error?.code === 'AuthorizationException' ||
          error?.status === 403
      ) {
        showStatistics.value = false
        statisticsByCampaignId.value = {}
        return
      }

      throw error
    }
  }

  return {
    statisticsByCampaignId,
    showStatistics,
    getCampaignStatistics,
    fetchCampaignStatistics,
  }
}
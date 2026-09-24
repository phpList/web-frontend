import { ref } from 'vue'

export function useCampaignLists(listMessagesClient) {
  const listsByCampaignId = ref({})
  const loadingListsByCampaignId = ref({})
  const expandedListsByCampaignId = ref({})

  const getCampaignLists = (campaignId) => listsByCampaignId.value[campaignId] || []
  const isListsLoading = (campaignId) => loadingListsByCampaignId.value[campaignId] === true
  const isListsExpanded = (campaignId) => expandedListsByCampaignId.value[campaignId] === true

  const toggleListsExpanded = (campaignId) => {
    expandedListsByCampaignId.value = {
      ...expandedListsByCampaignId.value,
      [campaignId]: !isListsExpanded(campaignId)
    }
  }

  const fetchListsForVisibleCampaigns = async (campaignIds) => {
    const pending = campaignIds
      .filter((campaignId) => !(campaignId in listsByCampaignId.value) && !loadingListsByCampaignId.value[campaignId])

    if (pending.length === 0) return

    pending.forEach((campaignId) => {
      loadingListsByCampaignId.value = { ...loadingListsByCampaignId.value, [campaignId]: true }
    })

    const results = await Promise.allSettled(
      pending.map(async (campaignId) => {
        const response = await listMessagesClient.getListsByMessage(campaignId)
        return {
          campaignId,
          lists: Array.isArray(response?.items) ? response.items : []
        }
      })
    )

    const nextLists = { ...listsByCampaignId.value }
    const nextLoading = { ...loadingListsByCampaignId.value }

    results.forEach((result, index) => {
      const campaignId = pending[index]
      if (result.status === 'fulfilled') {
        nextLists[campaignId] = result.value.lists
      } else {
        nextLists[campaignId] = []
        console.error(`Failed to load lists for campaign ${campaignId}:`, result.reason)
      }
      nextLoading[campaignId] = false
    })

    listsByCampaignId.value = nextLists
    loadingListsByCampaignId.value = nextLoading
  }

  return {
    getCampaignLists,
    isListsLoading,
    isListsExpanded,
    toggleListsExpanded,
    fetchListsForVisibleCampaigns,
  }
}
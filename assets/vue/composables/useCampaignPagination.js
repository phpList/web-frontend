import { computed, ref, watch } from 'vue'

const parseStatusQuery = (statusQuery, allowedStatuses) => {
  const value = Array.isArray(statusQuery) ? statusQuery[0] : statusQuery
  return allowedStatuses.includes(value) ? value : 'all'
}

const parsePageQuery = (pageQuery) => {
  const queryValue = Array.isArray(pageQuery) ? pageQuery[0] : pageQuery
  const page = Number.parseInt(String(queryValue ?? ''), 10)
  return Number.isNaN(page) || page < 1 ? 1 : page
}

// Cursor-based pagination synced with the route's `status`/`page` query params. Encapsulates the
// per-page cache, cursor bookkeeping, and the generation/in-flight-request guards needed so a slow
// response from a since-abandoned filter can never overwrite the current view.
export function useCampaignPagination({ route, router, pageSize, allowedStatuses, fetchPage }) {
  const rawItemsByPage = ref(new Map())
  const cursorsByPage = ref(new Map([[1, null]]))
  const total = ref(0)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const statusFilter = computed({
    get() {
      return parseStatusQuery(route.query.status, allowedStatuses)
    },
    async set(value) {
      const normalized = allowedStatuses.includes(value) ? value : 'all'
      const nextQuery = { ...route.query }

      if (normalized === 'all') {
        delete nextQuery.status
      } else {
        nextQuery.status = normalized
      }

      delete nextQuery.page

      await router.replace({ query: nextQuery })
    }
  })

  const currentPage = ref(parsePageQuery(route.query.page))

  let generation = 0
  const requestsInFlight = new Map()

  const resetPagination = () => {
    generation += 1
    requestsInFlight.clear()
    rawItemsByPage.value = new Map()
    cursorsByPage.value = new Map([[1, null]])
  }

  // Fetches and caches one page at a time. This only fetches/caches; it never touches
  // `currentPage` itself, so walking through intermediate pages (see loadUpToPage) can't leak a
  // transient wrong page number out to the URL-syncing watchers.
  const loadPage = (page) => {
    if (rawItemsByPage.value.has(page)) {
      return Promise.resolve()
    }

    const inFlight = requestsInFlight.get(page)
    if (inFlight) return inFlight

    const thisGeneration = generation
    const request = (async () => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        const afterId = cursorsByPage.value.get(page) ?? null
        const response = await fetchPage(afterId, pageSize, statusFilter.value)
        if (thisGeneration !== generation) return

        const items = Array.isArray(response?.items) ? response.items : []

        rawItemsByPage.value.set(page, items)
        total.value = Number(response?.pagination?.total ?? 0)

        if (response?.pagination?.hasMore) {
          cursorsByPage.value.set(page + 1, response?.pagination?.nextCursor ?? null)
        }
      } catch (error) {
        if (thisGeneration === generation) {
          console.error(`Failed to load campaigns page ${page}:`, error)
          errorMessage.value = 'Failed to load campaigns.'
        }
      } finally {
        isLoading.value = false
        requestsInFlight.delete(page)
      }
    })()

    requestsInFlight.set(page, request)
    return request
  }

  // Navigates to a page, fetching/caching every page from 1 up to it along the way (cursors for
  // unvisited pages aren't known ahead of time), then commits currentPage exactly once at the end.
  const loadUpToPage = async (targetPage) => {
    for (let page = 1; page <= targetPage; page += 1) {
      await loadPage(page)
    }
    currentPage.value = targetPage
  }

  // A mutation can shift which items fall on the current page and every page after it (but never
  // on earlier pages), so drop those from the cache and refetch just the current one.
  const invalidateFromCurrentPage = () => {
    const page = currentPage.value
    for (const key of [...rawItemsByPage.value.keys()]) {
      if (key >= page) rawItemsByPage.value.delete(key)
    }
    for (const key of [...cursorsByPage.value.keys()]) {
      if (key > page) cursorsByPage.value.delete(key)
    }
  }

  const refreshCurrentPage = async () => {
    invalidateFromCurrentPage()
    await loadPage(currentPage.value)
  }

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  const canGoPrevious = computed(() => currentPage.value > 1)
  const canGoNext = computed(() => currentPage.value < totalPages.value)

  const rangeStart = computed(() => (total.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1))
  const rangeEnd = computed(() => (total.value === 0 ? 0 : Math.min(currentPage.value * pageSize, total.value)))

  const setFilter = (filterId) => {
    statusFilter.value = filterId
  }

  const previousPage = async () => {
    if (canGoPrevious.value) {
      const target = currentPage.value - 1
      await loadPage(target)
      currentPage.value = target
    }
  }

  const nextPage = async () => {
    if (canGoNext.value) {
      const target = currentPage.value + 1
      await loadPage(target)
      currentPage.value = target
    }
  }

  watch(statusFilter, () => {
    resetPagination()
    loadPage(1).then(() => {
      currentPage.value = 1
    })
  })

  watch(totalPages, (pages) => {
    if (isLoading.value) return
    if (currentPage.value > pages) {
      loadPage(pages).then(() => {
        currentPage.value = pages
      })
    }
  })

  watch(() => route.query.page, (pageQuery) => {
    const nextPage = parsePageQuery(pageQuery)
    if (nextPage !== currentPage.value) {
      loadUpToPage(nextPage)
    }
  })

  watch(currentPage, async (page) => {
    const normalizedPage = isLoading.value
      ? Math.max(1, page)
      : Math.min(Math.max(1, page), totalPages.value)
    if (normalizedPage !== page) {
      currentPage.value = normalizedPage
      return
    }

    const currentQueryPage = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
    const desiredQueryPage = normalizedPage > 1 ? String(normalizedPage) : undefined
    if (currentQueryPage === desiredQueryPage) {
      return
    }

    const nextQuery = { ...route.query }
    if (desiredQueryPage !== undefined) {
      nextQuery.page = desiredQueryPage
    } else {
      delete nextQuery.page
    }

    await router.replace({
      query: nextQuery
    })
  })

  const rawItems = computed(() => rawItemsByPage.value.get(currentPage.value) ?? [])

  return {
    statusFilter,
    currentPage,
    rawItems,
    total,
    isLoading,
    errorMessage,
    totalPages,
    canGoPrevious,
    canGoNext,
    rangeStart,
    rangeEnd,
    setFilter,
    previousPage,
    nextPage,
    loadUpToPage,
    refreshCurrentPage,
  }
}
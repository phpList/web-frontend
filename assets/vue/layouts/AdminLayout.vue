<!-- assets/vue/layouts/DashboardLayout.vue -->
<template>
  <div class="d-flex min-vh-100">
    <!-- Content area -->
    <div class="d-flex flex-column flex-grow-1">
      <!-- Topbar -->
      <header class="bg-white border-bottom py-3 px-4 sticky-top" style="z-index: 1030;">
        <div class="d-flex align-items-center gap-3">
          <!-- Search -->
          <form class="flex-grow-1" role="search" @submit.prevent>
            <div class="input-group">
          <span class="input-group-text bg-white border-end-0">
            <BaseIcon name="search" />
          </span>
              <input
                  type="search"
                  class="form-control border-start-0"
                  placeholder="Search subscribers, campaigns..."
              />
            </div>
          </form>

          <div class="d-flex gap-3 ms-auto">
            <!-- Create Campaign button -->
            <button type="button" class="btn btn-primary d-flex align-items-center  mx-4">
              <span class="me-2 mr-2">+</span>
              <span>Create Campaign</span>
            </button>

            <!-- Notifications -->
            <button
                type="button"
                class="btn position-relative p-0 border-0 bg-transparent d-flex align-items-center  mx-4"
            >
              <BaseIcon name="notification" />
              <span
                  class="position-absolute top-0 start-100 translate-middle p-0 bg-danger border border-light"
              >
        </span>
            </button>
            <!-- User dropdown -->
            <div class="dropdown">
              <button
                  class="btn d-flex align-items-center"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
              >
                <div class="text-end lh-sm mx-2">
                  <div class="fw-semibold small">Admin User</div>
                </div>

                <img
                    :src="avatar"
                    alt="Admin User"
                    class="rounded-circle"
                    width="24"
                    height="24"
                />

                <BaseIcon name="chevron-down" />
              </button>

              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item" type="button">Profile</button></li>
                <li><button class="dropdown-item" type="button">Settings</button></li>
                <li><hr class="dropdown-divider" /></li>
                <li><button class="dropdown-item" type="button">Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="flex-grow-1 py-4 px-5 bg-light">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
/* No imports required */
import BaseIcon from "../components/base/BaseIcon.vue";
</script>

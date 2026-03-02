<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="bg-slate-50 text-slate-500 font-medium">
        <tr>
          <th class="px-6 py-4">Email</th>
          <th class="px-6 py-4">Name</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Lists</th>
          <th class="px-6 py-4 text-right">Opens</th>
          <th class="px-6 py-4">Joined</th>
          <th class="px-6 py-4 w-10"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200">
        <tr
          v-for="subscriber in subscribers"
          :key="subscriber.email"
          class="hover:bg-slate-50  transition-colors group"
        >
          <td class="px-6 py-4 font-mono text-sm text-slate-900">
            {{ subscriber.email }}
          </td>
          <td class="px-6 py-4 text-slate-600 ">
            {{ subscriber.name }}
          </td>
          <td class="px-6 py-4">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="statusClasses[subscriber.status]"
            >
              {{ subscriber.status }}
            </span>
          </td>
          <td class="px-6 py-4 text-right text-slate-600">
            {{ subscriber.lists }}
          </td>
          <td class="px-6 py-4 text-right text-slate-600">
            {{ subscriber.opens }}
          </td>
          <td class="px-6 py-4 text-slate-600">
            {{ subscriber.joined }}
          </td>
          <td class="px-6 py-4 text-right">
            <button class="text-slate-400 hover:text-slate-600">
              <BaseIcon name="eye" class="w-4 h-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'

const statusClasses = {
  active: 'bg-emerald-100 text-emerald-700',
  unconfirmed: 'bg-amber-100 text-amber-700',
  bounced: 'bg-red-100 text-red-700',
  unsubscribed: 'bg-slate-100 text-slate-600',
}

const subscribers = [
  {
    email: 'alice.johnson@example.com',
    name: 'Alice Johnson',
    status: 'active',
    lists: 3,
    opens: 45,
    joined: '2023-01-15',
  },
  {
    email: 'bob.smith@example.com',
    name: 'Bob Smith',
    status: 'active',
    lists: 2,
    opens: 32,
    joined: '2023-02-20',
  },
  {
    email: 'carol.williams@example.com',
    name: 'Carol Williams',
    status: 'unconfirmed',
    lists: 1,
    opens: 0,
    joined: '2023-03-10',
  },
  {
    email: 'david.brown@example.com',
    name: 'David Brown',
    status: 'bounced',
    lists: 2,
    opens: 28,
    joined: '2022-12-05',
  },
  {
    email: 'emma.davis@example.com',
    name: 'Emma Davis',
    status: 'active',
    lists: 4,
    opens: 67,
    joined: '2023-01-22',
  },
]
</script>

<script setup lang="ts">
const api = useApi();

const props = defineProps<{
  issue: {
    id: number;
    issueDetails: string;
    actionPlan: string | null;
    issueType: string;
    responsibleGroupName: string;
    responsibleEmployee: string;
    status: number;
  };
}>();

const emit = defineEmits<{
  close: [boolean];
}>();

type IssueStatus = {
  id: number;
  name: string;
};

const statusColorMap: Record<string, any> = {
  'OPEN': 'primary',
  'PARKED': 'warning',
  'CLOSED': 'nuetral',
  'DROPPED': 'error',
};

const issueStatuses = ref<IssueStatus[]>([]);
const loadingStatus = ref(false);

const fetchStatuses = async () => {
  loadingStatus.value = true;
  try {
    const res: any = await api.getStatus();
    issueStatuses.value = res.data.items;
  } catch (err) {
    console.error("Failed to fetch statuses", err);
  } finally {
    loadingStatus.value = false;
  }
};

onMounted(fetchStatuses);

const getStatusColor = (statusId: number) => {
  const status = issueStatuses.value.find((s) => s.id === statusId);
  const name = status?.name.toUpperCase() ?? '';
  return statusColorMap[name] ?? 'neutral'; 
};

const getStatusName = (statusId: number) => {
  const status = issueStatuses.value.find((s) => s.id === statusId);
  return status?.name ?? "Unknown";
};
</script>

<template>
  <UModal title="View Issue Details" description="Issue Details" :ui="{ title: 'text-2xl font-semibold', description: 'text-sm text-gray-500'}">
    <UButton
      icon="i-lucide-eye"
      color="info"
      variant="solid"
      size="xs"
      aria-label="View"
    />
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Issue ID</label
          >
          <p class="mt-1 text-sm text-gray-900">#{{ issue.id }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <UBadge :color="getStatusColor(issue.status)" :label="getStatusName(issue.status)" class="mt-1" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Issue Details</label
          >
          <p class="mt-1 text-sm text-gray-900">{{ issue.issueDetails }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Action Plan</label
          >
          <p class="mt-1 text-sm text-gray-900">
            {{ issue.actionPlan || "No action plan provided" }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Issue Type</label
          >
          <p class="mt-1 text-sm text-gray-900">{{ issue.issueType }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Responsible Group</label
          >
          <p class="mt-1 text-sm text-gray-900">
            {{ issue.responsibleGroupName }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Responsible Employee</label
          >
          <p class="mt-1 text-sm text-gray-900">
            {{ issue.responsibleEmployee || "Not assigned" }}
          </p>
        </div>
      </div>
    </template>

    <template #footer="{close}">
      <div class="flex gap-4 justify-end">
        <UButton @click="close" variant="outline">
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>

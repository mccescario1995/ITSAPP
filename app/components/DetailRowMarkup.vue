<script setup lang="ts">
const props = defineProps<{
  label: string;
  value?: any;
  issue?: {
    createdBy: string;
    createdDate: string;
    issueDetails: string;
  } | null;
  tab?: any;
}>();

const api = await useApi();
const auth = (await api.getSession()) as SessionUser;

// Safe accessor helpers
const createdBy = computed(
  () => props.value?.createdBy || props.value?.issue?.createdBy || "",
);
const createdDate = computed(
  () => props.value?.createdDate || props.value?.issue?.createdDate || "",
);
const issueDetails = computed(
  () => props.value?.issueDetails || props.value?.issue?.issueDetails || "",
);

const formatDate = (date: string) => {
  if (!date) return "";

  const d = new Date(date.includes("T") ? date : date.replace(" ", "T"));

  if (isNaN(d.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};
</script>

<template>
  <div
    class="relative -left-[35px] flex items-start gap-3 text-sm text-gray-500 w-full"
  >
    <span
      class="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 border"
    >
      <UIcon name="i-lucide-user" class="text-gray-500" />
    </span>

    <div
      class="bg-white border rounded-lg shadow-sm w-full"
      :class="
        props.value?.Id === auth.userId
          ? 'bg-blue-50 text-gray-700'
          : 'bg-yellow-50 text-gray-700 '
      "
    >
      <div
        class="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-lg"
        :class="
          props.value?.Id === auth.userId
            ? 'bg-blue-100 text-gray-700'
            : 'bg-yellow-100 text-gray-700 '
        "
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="text-gray-500" />
          <span class="text-sm font-bold">
            <!-- {{ createdBy }} -->

            {{  tab === 'details'
              ? props.value?.createdBy
              : props.value?.responsibleEmployee }}
          </span>
        </div>

        <span class="text-xs text-gray-500">
          {{ formatDate(createdDate) }}
        </span>
      </div>

      <div class="px-4 py-3 text-sm text-gray-800 whitespace-pre-line">
        <UEditor
          :model-value="
            tab === 'details'
              ? props.value?.issueDetails
              : props.value?.actionPlan
          "
          :editable="false"
        />
      </div>
    </div>
  </div>
</template>

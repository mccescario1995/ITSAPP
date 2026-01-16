<script lang="ts" setup>
definePageMeta({
  title: "Issue Page",
  layout: "sidebar-dashboard",
});

import type { TableColumn } from "@nuxt/ui";

const api = useApi();

const issues = ref<Issue[]>([]);
const loading = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0,
});

const globalFilter = ref(null);

const table = useTemplateRef("table");

const fetchIssues = async () => {
  loading.value = true;

  try {
    const res: any = await api.getIssues({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      search: globalFilter.value,
    });

    issues.value = res.data.items;
    pagination.value.total = res.data.pagination.totalCount;
  } catch (err) {
    console.error("Failed to fetch issues", err);
  } finally {
    loading.value = false;
  }
};


const onPageChange = () => {
  // Ensure valid page number
  if (!pagination.value.page || pagination.value.page < 1) {
    pagination.value.page = 1;
  }

  // Optional: clamp to max page if known
  const maxPage = Math.ceil(
    pagination.value.total / pagination.value.pageSize
  );

  if (pagination.value.page > maxPage) {
    pagination.value.page = maxPage || 1;
  }

  fetchIssues();
};



// Table Columns
const columns: TableColumn<Issue>[] = [
  { accessorKey: "id", header: "#", cell: ({ row }) => `#${row.original.id}` },
  { accessorKey: "issueDetails", header: "Issue Details" },
  { accessorKey: "actionPlan", header: "Action Plan" },
  { accessorKey: "issueType", header: "Issue Type" },
  { accessorKey: "responsibleGroupName", header: "Responsible Group" },
  { accessorKey: "responsibleEmployee", header: "Responsible Employee" },
];

// Issue item type
export type Issue = {
  id: number;
  issueDetails: string;
  actionPlan: string;
  issueType: string;
  responsibleGroupName: string;
  responsibleEmployee: string;
};

watch(
  () => [pagination.value.page, pagination.value.pageSize, globalFilter.value],
  fetchIssues,
  { immediate: true }
);
</script>

<style lang="css" scoped></style>

<template>
  <div class="w-full space-y-4 pb-4">
    <div class="flex px-4 matr">
      <UButton variant="solid" class="px-7">Add Issue</UButton>
    </div>
    <div class="flex px-4 py-2 border-b border-accented">
      <div class="justify-start mr-4">
        <UInput
          v-model="globalFilter"
          placeholder="Search..."
          @input="pagination.page = 1"
        />
      </div>
      <div class="justify-end ml-auto">
        <UFormField label="No. of Page" orientation="horizontal">
        <UInput
          type="text"
          v-model.number="pagination.pageSize"
          min="1"
          size="md"
          class="w-24"
          :aria-label="'No. of Page'"
          @change="onPageChange"
        /></UFormField>
      </div>
    </div>

    <UTable :data="issues" :columns="columns" :loading="loading" />

    <div class="flex justify-start border-t border-default pt-4 px-4">
      <UPagination
        :page="pagination.page"
        :items-per-page="pagination.pageSize"
        :total="pagination.total"
        @update:page="(p) => (pagination.page = p)"
      />
    </div>
  </div>
</template>

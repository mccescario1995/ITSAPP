<script lang="ts" setup>
definePageMeta({
  title: "Issue Page",
  layout: "sidebar-dashboard",
  middleware: "auth",
});
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";

const { allowOnlyNumbers, numbersOnlyOnPaste } = await useInputRestriction();

export type UserProfile = {
  UserId: number;
  Username: string;
  EmplId: string;
  Employeename2: string;
  Corporate: string;
  Positionname: string;
  Departmentname: string;
};

export type SessionUser = {
  userId: number;
  username: string;
  role: "USER" | "ADMIN" | string;
  profile: UserProfile;
};
const api = useApi();
const route = useRoute();
const toast = useToast();
const auth = useAuthStorage();
const userProfile = auth.userProfile;

const issues = ref<Issue[]>([]);
const loading = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0,
});

const globalFilter = ref(null);

const fetchIssues = async () => {
  loading.value = true;
  console.log("User profile:", userProfile.value);
  console.log("User profile role:", userProfile.value?.role);
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

  const maxPage = Math.ceil(pagination.value.total / pagination.value.pageSize);

  if (pagination.value.page > maxPage) {
    pagination.value.page = maxPage || 1;
  }

  fetchIssues();
};

type IssueStatus = {
  id: number;
  name: string;
};

const statusColorMap: Record<string, any> = {
  OPEN: "primary",
  PARKED: "warning",
  CLOSED: "nuetral",
  DROPPED: "error",
};

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

const onPageSwitch = () => {
  // Ensure valid page number
  if (!pagination.value.page || pagination.value.page < 1) {
    pagination.value.page = 1;
  }

  const maxPage = Math.ceil(pagination.value.total / pagination.value.pageSize);

  if (pagination.value.page > maxPage) {
    pagination.value.page = maxPage || 1;
  }

  fetchIssues();
};

onMounted(fetchStatuses);

const issueStatuses = ref<IssueStatus[]>([]);
const loadingStatus = ref(false);

const getStatusColor = (statusId: number) => {
  const status: any = issueStatuses.value.find((s) => s.id === statusId);
  const name = status?.name.toUpperCase() ?? "";
  return statusColorMap[name] ?? "neutral";
};

// Table Columns
const columns: TableColumn<Issue>[] = [
  { accessorKey: "id", header: "#", cell: ({ row }) => `#${row.original.id}` },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const issue = row.original;
      const UButton = resolveComponent("UButton");
      const EditIssueModal = resolveComponent("EditIssueModal");
      const DeleteIssueModal = resolveComponent("DeleteIssueModal");
      return h("div", { class: "flex gap-1" }, [
        h(UButton, {
          size: "xs",
          color: "secondary",
          variant: "solid",
          icon: "i-lucide-eye",
          issue: issue,
          to: `/issue/${issue.id}`,
        }),
        h(EditIssueModal, {
          size: "xs",
          color: "info",
          variant: "solid",
          icon: "i-lucide-edit-2",
          issue: issue,
        }),
        h(DeleteIssueModal, {
          size: "xs",
          variant: "solid",
          color: "error",
          icon: "i-lucide-trash",
          issue: issue,
        }),
      ]);
    },
  },
  { accessorKey: "issueDetails", header: "Issue Details" },
  {
    accessorKey: "statusName",
    header: "Status",
    cell: ({ row }) => {
      const status: any = row.original;
      const UBadge = resolveComponent("UBadge");
      return h(UBadge, {
        label: status.statusName,
        color: getStatusColor(status.status),
        class: "w-full justify-center",
      });
    },
  },
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
  issueTypeId: number;
  responsibleGroupId: number;
  responsibleEmpId: string | null;
  status: number;
};

const isModalOpen = ref(false)

const handleClose = (success: boolean) => {
  if (success) {
    fetchIssues();
  }
}

watch(
  () => [pagination.value.page, pagination.value.pageSize, globalFilter.value],
  fetchIssues,
  { immediate: true },
);
</script>

<style lang="css" scoped></style>

<template>
  <div class="w-full space-y-4 pb-4">
    <div>
      <UButton label="Add Issue" @click="isModalOpen = true" />
      <CreateIssueModal v-model="isModalOpen" @close="handleClose" />
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
        <UFormField label="No. of Items" orientation="horizontal">
          <UInput
            type="text"
            v-model.number="pagination.pageSize"
            min="1"
            size="md"
            class="w-24"
            :aria-label="'No. of Page'"
            @change="onPageChange"
            @keypress="allowOnlyNumbers"
            @paste="numbersOnlyOnPaste"
        /></UFormField>
      </div>
    </div>

    <UTable :data="issues" :columns="columns" :loading="loading" />

    <div class="border-t flex border-default pt-4 px-4">
      <UFormField
        label="Jump to page:"
        orientation="horizontal"
        class="justify-start"
      >
        <UInput
          type="text"
          v-model.number="pagination.page"
          min="1"
          size="md"
          class="w-7.5"
          :aria-label="'Go to page'"
          @change="onPageSwitch"
          @keypress="allowOnlyNumbers"
          @paste="numbersOnlyOnPaste"
      /></UFormField>

      <UPagination
        class="ml-auto"
        :page="pagination.page"
        :items-per-page="pagination.pageSize"
        :total="pagination.total"
        @update:page="(p) => (pagination.page = p)"
      />
    </div>
  </div>
</template>

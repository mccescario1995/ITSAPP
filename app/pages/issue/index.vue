<script lang="ts" setup>
definePageMeta({
  title: "Issue Page",
  layout: "sidebar-dashboard",
  middleware: "auth",
});
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";

const {
  allowOnlyNumbers,
  numbersOnlyOnPaste,
  allowOnlyNumbersWithMax,
  numbersOnlyOnPasteWithMax,
  validateMaxPage,
} = await useInputRestriction();

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
  totalPages: 0,
});

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
    pagination.value.totalPages = res.data.pagination.totalPages;
  } catch (err) {
    console.error("Failed to fetch issues", err);
  } finally {
    loading.value = false;
  }
};

const maxPage = computed(() => {
  return Math.ceil(pagination.value.total / pagination.value.pageSize) || 1;
});

// Computed handler for keypress with max validation and edge cases
const keypressWithMax = computed(() => {
  return (event: KeyboardEvent) => {
    const charCode = event.charCode || event.keyCode;

    // Allow control keys (backspace=8, tab=9, delete=46, arrows=37/39, enter=13, escape=27)
    if ([8, 9, 37, 39, 46, 13, 27].includes(charCode)) return;

    // Prevent if empty/only zeros and would exceed max
    const target = event.target as HTMLInputElement;
    const currentValue = target.value || "";
    const newChar = String.fromCharCode(charCode);
    const newValue = currentValue + newChar;

    // Check if it's a number
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return;
    }

    // Prevent leading zeros (edge case)
    if (currentValue === "0" && newChar !== "") {
      event.preventDefault();
      return;
    }

    // Prevent if value would exceed max page
    if (parseInt(newValue) > maxPage.value) {
      event.preventDefault();
      return;
    }

    // Prevent if value is 0
    if (parseInt(newValue) === 0) {
      event.preventDefault();
      return;
    }
  };
});

// Computed handler for paste with max validation and edge cases
const pasteWithMax = computed(() => {
  return (event: ClipboardEvent) => {
    const pasted = event.clipboardData?.getData("text") ?? "";

    // Empty paste
    if (!pasted) {
      event.preventDefault();
      return;
    }

    // Allow only numbers
    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
      return;
    }

    const pastedNum = parseInt(pasted);

    // Prevent if exceeds max page
    if (pastedNum > maxPage.value) {
      event.preventDefault();
      return;
    }

    // Prevent if 0
    if (pastedNum === 0) {
      event.preventDefault();
      return;
    }

    // Prevent leading zeros (edge case)
    if (/^0+$/.test(pasted)) {
      event.preventDefault();
      return;
    }
  };
});

// Computed handler for input to validate on change
const inputValidation = computed(() => {
  return (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // Handle empty input
    if (value === "" || value === null || value === undefined) {
      return; // Let v-model handle empty
    }

    const numValue = parseInt(value);

    // Invalid number
    if (isNaN(numValue)) {
      target.value = "1";
      pagination.value.page = 1;
      return;
    }

    // Exceeds max page
    if (numValue > maxPage.value) {
      target.value = maxPage.value.toString();
      pagination.value.page = maxPage.value;
      return;
    }

    // Less than 1
    if (numValue < 1) {
      target.value = "1";
      pagination.value.page = 1;
      return;
    }

    // Valid - update pagination
    pagination.value.page = numValue;
  };
});

const onPageChange = () => {
  // Ensure valid page number
  if (!pagination.value.page || pagination.value.page < 1) {
    pagination.value.page = 1;
  }

  if (pagination.value.page > maxPage.value) {
    pagination.value.page = maxPage.value;
  }

  fetchIssues();
};

const onPageSwitch = () => {
  if (pagination.value.page > maxPage.value) {
    pagination.value.page = maxPage.value;
  }
  if (pagination.value.page < 1) {
    pagination.value.page = 1;
  }

  if (!pagination.value.page || pagination.value.page < 1) {
    pagination.value.page = 1;
  }

  if (pagination.value.page > maxPage.value) {
    pagination.value.page = maxPage.value;
  }

  fetchIssues();
};

const onPageInput = () => {
  if (pagination.value.page > maxPage.value) {
    pagination.value.page = maxPage.value;
  }
  if (pagination.value.page < 1) {
    pagination.value.page = 1;
  }
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

onMounted(fetchStatuses);

const globalFilter = ref(null);

const deleteModal = ref({
  isOpen: false,
  issue: null as Issue | null,
});

const openDeleteModal = (issue: Issue) => {
  deleteModal.value = {
    isOpen: true,
    issue,
  };
};

const closeDeleteModal = () => {
  deleteModal.value = {
    isOpen: false,
    issue: null,
  };
};

const handleDeleteSuccess = () => {
  closeDeleteModal();
  fetchIssues();
};

const editModal = ref({
  isOpen: false,
  issue: null as Issue | null,
});

const closeEditModal = () => {
  editModal.value = {
    isOpen: false,
    issue: null,
  };
};

const handleEditSuccess = () => {
  closeEditModal();
  fetchIssues(); // Refresh the table
};

const issueStatuses = ref<IssueStatus[]>([]);
const loadingStatus = ref(false);

const getStatusColor = (statusId: number) => {
  const status: any = issueStatuses.value.find((s) => s.id === statusId);
  const name = status?.name.toUpperCase() ?? "";
  return statusColorMap[name] ?? "neutral";
};

const stripHtml = (html: string) => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
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
      const isOpen = ref(false);

      return h("div", { class: "flex gap-1" }, [
        h(UButton, {
          size: "xs",
          color: "secondary",
          variant: "solid",
          icon: "i-lucide-eye",
          to: `/issue/${issue.id}`,
        }),
        h(UButton, {
          size: "xs",
          color: "primary",
          variant: "solid",
          icon: "i-lucide-edit-2",
          to: `/issue/edit/${issue.id}`,
        }),
        h(UButton, {
          size: "xs",
          color: "error",
          icon: "i-lucide-trash",
          onClick: () => openDeleteModal(issue),
        }),
      ]);
    },
  },
  {
    accessorKey: "issueDetails",
    header: "Issue Details",
    cell: ({ row }) => {
      const issue = row.original;
      const UEditor = resolveComponent("UEditor");

      return h(UEditor, {
        modelValue: issue.issueDetails,
        editable: false,
        class:
          "max-w-45 line-clamp-1 prose prose-sm [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0",
      });
    },
  },

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
  { accessorKey: "issueType", header: "Issue Type" },
  {
    accessorKey: "responsibleGroupName",
    header: "Responsible Group",
  },
  {
    accessorKey: "responsibleEmployee",
    header: "Responsible Employee",
    cell: ({ row }) => {
      const emp: any = row.original;

      if (emp.responsibleEmployee == null) {
        return "Not assigned";
      }

      return emp.responsibleEmployee;
    },
  },
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
  responsibleEmployeeId: string | null;
  status: number;
};

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
      <!-- <UButton label="Add Issue" @click="isModalOpen = true" />
      <CreateIssueModal v-model="isModalOpen" @close="handleClose" /> -->
      <UButton label="Add Issue" to="/issue/create" />
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
      <UPagination
        class="justify-start"
        :page="pagination.page"
        :items-per-page="pagination.pageSize"
        :total="pagination.total"
        @update:page="(p) => (pagination.page = p)"
      />

      <UFormField
        label="Jump to page:"
        orientation="horizontal"
        class="ml-auto"
      >
        <UInput
          type="text"
          v-model.number="pagination.page"
          size="md"
          class="w-15"
          :max="maxPage"
          :aria-label="'Go to page'"
          @change="onPageSwitch"
          @keypress="keypressWithMax"
          @paste="pasteWithMax"
          @input="inputValidation"
        />
        <!-- @keypress="allowOnlyNumbers"
          @paste="numbersOnlyOnPaste" -->
      </UFormField>
    </div>
    <EditIssueModal
      v-if="editModal.issue"
      :open="editModal.isOpen"
      @update:open="(v) => (editModal.isOpen = v)"
      :issue="editModal.issue"
      @success="handleEditSuccess"
    />
    <DeleteIssueModal
      v-if="deleteModal.issue"
      :open="deleteModal.isOpen"
      @update:open="(v) => (deleteModal.isOpen = v)"
      :issue="deleteModal.issue"
      @success="handleDeleteSuccess"
    />
  </div>
</template>

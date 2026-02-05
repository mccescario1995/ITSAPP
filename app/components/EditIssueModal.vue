<script setup lang="ts">
import { z } from "zod";
import type { EditorToolbarItem } from "@nuxt/ui";

const props = defineProps<{
  open: boolean;
  issue: {
    id: number;
    issueDetails: string;
    actionPlan: string | null;
    issueTypeId: number;
    responsibleGroupId: number;
    responsibleEmployeeId: string | null;
    responsibleEmployee: string;
    status: number;
  };
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}>();

const api = useApi();
const { userProfile } = useAuthStorage();
const toast = useToast();

const issueTypes = ref([]);
const groups = ref([]);
const employees = ref<any>([]);
const status = ref([]);
const selectedEmployee = ref<{ value: string; label: string } | null>(null);
const loading = ref(false);
const search = ref("");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const form: any = reactive({
  issueDetails: props.issue.issueDetails,
  actionPlan: props.issue.actionPlan || "",
  issueTypeId: props.issue.issueTypeId,
  responsibleGroupId: props.issue.responsibleGroupId,
  responsibleEmpId: props.issue.responsibleEmployeeId || "",
  status: props.issue.status,
});

const schema = z.object({
  issueDetails: z.string().min(1, "Issue details are required"),
  actionPlan: z.string().optional().nullable(),
  issueTypeId: z.number().min(1, "Issue type is required"),
  responsibleGroupId: z.number().min(1, "Responsible group is required"),
  responsibleEmpId: z.string().optional().nullable(),
  status: z.number().min(1, "Status is required"),
});

type Schema = z.output<typeof schema>;

const auth = (await api.getSession()) as SessionUser;

const fetchOptions = async () => {
  try {
    const [typesRes, groupsRes, statusRes] = await Promise.all([
      api.getIssueTypes(),
      api.getGroups(),
      api.getStatus(),
    ]);
    issueTypes.value = (typesRes as any).data.items || typesRes;
    groups.value = (groupsRes as any).data.items || groupsRes;
    status.value = (statusRes as any).data.items || statusRes;
  } catch (error) {
    console.error("Failed to fetch options", error);
    toast.add({
      title: "Error",
      description: "Failed to load form options",
      color: "error",
    });
  }
};

const onSubmit = async () => {
  loading.value = true;
  try {
    const data = {
      issuedetails: form.issueDetails,
      actionplan: form.actionPlan || null,
      issuetypeid: form.issueTypeId,
      responsiblegroupid: form.responsibleGroupId,
      responsibleempid: form.responsibleEmpId || null,
      status: form.status,
      modifiedbyuserid: auth.userId,
    };

    const response = await api.updateIssue(props.issue.id, data);

    if (response) {
      toast.add({
        title: "Success",
        description: "Issue updated successfully",
        color: "success",
      });

      // Close modal and emit success
      emit("update:open", false);
      emit("success");
    }
  } catch (error) {
    console.error("Failed to update issue", error);
    toast.add({
      title: "Error",
      description: "Failed to update issue",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const fetchEmployees = async (query: string) => {
  if (!query || query.length < 1) {
    employees.value = [];
    return;
  }

  loading.value = true;
  try {
    const res = await api.searchEmployees(query);

    const items = (res.data?.items ?? []).map((e: any) => ({
      value: e.emplId,
      label: e.employeename,
    }));

    employees.value = items;
  } catch (err) {
    console.error("Employee search failed:", err);
    employees.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch search input and fetch employees dynamically
watch(search, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    fetchEmployees(val);
  }, 300);
});

watch(selectedEmployee, (val: any) => {
  form.responsibleEmpId = val?.value ?? "";
});

onMounted(async () => {
  await fetchOptions();
  if (props.issue.responsibleEmployeeId) {
    selectedEmployee.value = {
      value: props.issue.responsibleEmployeeId,
      label: props.issue.responsibleEmployee,
    };
  }
});

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await fetchOptions();
      if (props.issue.responsibleEmployeeId) {
        selectedEmployee.value = {
          value: props.issue.responsibleEmployeeId,
          label: props.issue.responsibleEmployee,
        };
      }
    }
  },
);

const toolbarItems: EditorToolbarItem[][] = [
  [
    {
      kind: "mark",
      mark: "bold",
      icon: "i-lucide-bold",
      tooltip: { text: "Bold" },
    },
    {
      kind: "mark",
      mark: "italic",
      icon: "i-lucide-italic",
      tooltip: { text: "Italic" },
    },
    {
      kind: "mark",
      mark: "underline",
      icon: "i-lucide-underline",
      tooltip: { text: "Underline" },
    },
  ],
  [
    {
      kind: "bulletList",
      icon: "i-lucide-list",
      tooltip: { text: "Bullet List" },
    },
    {
      kind: "orderedList",
      icon: "i-lucide-list-ordered",
      tooltip: { text: "Ordered List" },
    },
  ],
  [
    {
      kind: "blockquote",
      icon: "i-lucide-text-quote",
      tooltip: { text: "Quote" },
    },
    {
      kind: "codeBlock",
      icon: "i-lucide-square-code",
      tooltip: { text: "Code Block" },
    },
  ],
];
</script>

<template>
  <UModal
    :open="open"
    @update:open="$emit('update:open', $event)"
    title="Edit Issue"
    description="Edit an Existing Issue"
    :ui="{
      content:
        'w-[calc(100vw-2rem)] max-w-4xl rounded-lg shadow-lg ring ring-default',
      title: 'text-2xl font-semibold',
    }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField label="Issue Type" required>
          <USelect
            class="w-full"
            v-model="form.issueTypeId"
            :items="issueTypes"
            value-key="id"
            label-key="name"
            placeholder="Select issue type"
          />
        </UFormField>

        <UFormField label="Responsible Group" required>
          <USelect
            class="w-full"
            v-model="form.responsibleGroupId"
            :items="groups"
            value-key="id"
            label-key="name"
            placeholder="Select group"
          />
        </UFormField>

        <UFormField label="Responsible Employee">
          <USelectMenu
            class="w-full"
            v-model="selectedEmployee"
            v-model:search-term="search"
            :items="employees"
            placeholder="Type to search employee"
            :searchable="true"
            :loading="loading"
            clear
          />
        </UFormField>

        <UFormField label="Status" required>
          <USelect
            class="w-full"
            v-model="form.status"
            :items="status"
            value-key="id"
            label-key="name"
            placeholder="Select status"
          />
        </UFormField>

        <UFormField label="Issue Details" required>
          <!-- <UTextarea
            v-model="form.issueDetails"
            placeholder="Describe the issue..."
            :rows="4"
            class="w-full"
          /> -->
          <UEditor
            v-slot="{ editor }"
            v-model="form.issueDetails"
            content-type="html"
            placeholder="Describe the action plan..."
            class="w-full min-h-50 border p-2 rounded border-gray-300"
          >
            <UEditorToolbar :editor="editor" :items="toolbarItems" />
          </UEditor>
        </UFormField>

        <UFormField label="Action Plan">
          <UEditor
            v-slot="{ editor }"
            v-model="form.actionPlan"
            content-type="html"
            placeholder="Describe the action plan..."
            class="w-full min-h-50 border p-2 rounded border-gray-300"
          >
            <UEditorToolbar :editor="editor" :items="toolbarItems" />
          </UEditor>
        </UFormField>

        <div class="flex gap-4 justify-end">
          <UButton type="submit" :loading="loading" variant="solid">
            Update Issue
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Create Issue",
  layout: "sidebar-dashboard",
  middleware: "auth",
});

import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";
import type { EditorToolbarItem } from "@nuxt/ui";

const api = useApi();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const auth = (await api.getSession()) as SessionUser;

const issueTypes = ref([]);
const groups = ref([]);
const employees = ref<any>([]);
const status = ref([]);
const selectedEmployee = ref<{ value: string; label: string } | null>(null);
const loading = ref(false);
const loadingIssue = ref(false);
const search = ref("");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const schema = z.object({
  issueDetails: z.string().min(1, "Issue details are required"),
  actionPlan: z.string().optional().nullable(),
  issueTypeId: z.number().min(1, "Issue type is required"),
  responsibleGroupId: z.number().min(1, "Responsible group is required"),
  responsibleEmpId: z.string().optional().nullable(),
  status: z.number().min(1, "Status is required"),
});

type Schema = z.output<typeof schema>;

const form: any = reactive<{
  issueDetails: string;
  actionPlan: string | null;
  issueTypeId: number | undefined;
  responsibleGroupId: number | undefined;
  responsibleEmpId: string | null;
  status: number | undefined;
}>({
  issueDetails: "",
  actionPlan: null,
  issueTypeId: null as any,
  responsibleGroupId: null as any,
  responsibleEmpId: null,
  status: null as any,
});

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

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  try {
    const data = {
      issuedetails: event.data.issueDetails,
      actionplan: event.data.actionPlan || null,
      issuetypeid: event.data.issueTypeId,
      responsiblegroupid: event.data.responsibleGroupId,
      responsibleempid: event.data.responsibleEmpId || null,
      status: event.data.status,
      createdbyuserid: auth.userId,
    };

    const response = await api.createIssue(data);

    if (response) {
      toast.add({
        title: "Success",
        description: "Issue created successfully",
        color: "success",
        duration: 3000,
      });

      Object.assign(form, {
        issueDetails: "",
        actionPlan: null,
        issueTypeId: undefined,
        responsibleGroupId: undefined,
        responsibleEmpId: null,
        status: undefined,
      });
      selectedEmployee.value = null;
    }
  } catch (error) {
    console.error("Failed to create issue", error);
    toast.add({
      title: "Error",
      description: "Failed to create issue",
      color: "error",
    });
  } finally {
    loading.value = false;
      router.push(`/issue`);
  }
};

const fetchEmployees = async (query: string) => {
  if (!query || query.length < 1) {
    employees.value = [];
    return;
  }

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
  }
};

watch(search, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    fetchEmployees(val);
  }, 300);
});

watch(selectedEmployee, (val: any) => {
  form.responsibleEmpId = val?.value ?? null;
});

onMounted(fetchOptions);

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
  <div>
    <div class="mb-6">
      <UButton
        @click="router.back()"
        variant="outline"
        icon="i-lucide-arrow-left"
      >
        Back
      </UButton>
    </div>

    <!-- Loading state -->
    <div v-if="loadingIssue">
      <LoadingSpinner />
    </div>

    <div v-else class="space-y-4">
      <h1 class="text-2xl font-semibold mb-4">Create New Issue</h1>
      <UForm
        :schema="schema"
        :state="form"
        @submit="onSubmit"
        class="space-y-6 max-w-full mx-auto"
      >

        <!-- ISSUE INFORMATION -->
        <UCard class="rounded-xl shadow-sm">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-exclamation-circle"
                class="w-5 h-5 text-primary"
              />
              <h2 class="font-semibold text-lg">Issue Information</h2>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Issue Type" name="issueTypeId" required>
              <USelect
                v-model="form.issueTypeId"
                :items="issueTypes"
                value-key="id"
                label-key="name"
                placeholder="Select issue type"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Department" name="responsibleGroupId" required>
              <USelect
                v-model="form.responsibleGroupId"
                :items="groups"
                value-key="id"
                label-key="name"
                placeholder="Select department"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Assign To" name="responsibleEmpId" class="mt-4">
            <USelectMenu
              v-model="selectedEmployee"
              v-model:search-term="search"
              :items="employees"
              placeholder="Search employee..."
              searchable
              clear
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Issue Details"
            name="issueDetails"
            required
            class="mt-4"
          >
            <UEditor
              v-slot="{ editor }"
              v-model="form.issueDetails"
              content-type="html"
              placeholder="Describe the issue clearly..."
              class="border rounded-lg min-h-[180px] w-full p-1"
            >
              <UEditorToolbar :editor="editor" :items="toolbarItems" />
            </UEditor>
          </UFormField>
        </UCard>

        <!-- ACTION PLAN -->
        <UCard class="rounded-xl shadow-sm">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-clipboard-document-check"
                class="w-5 h-5 text-primary"
              />
              <h2 class="font-semibold text-lg">Action Plan</h2>
            </div>
          </template>

          <UFormField name="actionPlan">
            <UEditor
              v-slot="{ editor }"
              v-model="form.actionPlan"
              content-type="html"
              placeholder="Outline the steps to resolve the issue..."
              class="border rounded-lg min-h-[160px] w-full p-1"
            >
              <UEditorToolbar :editor="editor" :items="toolbarItems" />
            </UEditor>
          </UFormField>

          <UFormField label="Status" name="status" required class="mt-4">
            <USelect
              v-model="form.status"
              :items="status"
              value-key="id"
              label-key="name"
              placeholder="Select status"
            />
          </UFormField>
        </UCard>

        <!-- FOOTER ACTIONS -->
        <div class="flex justify-end gap-3 pt-6 border-t">
          <UButton
            type="submit"
            color="primary"
            size="lg"
            :loading="loading"
            icon="i-heroicons-paper-airplane"
          >
            Create Issue
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>

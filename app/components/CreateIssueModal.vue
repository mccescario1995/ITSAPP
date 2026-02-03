<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

const isOpen = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  close: [boolean];
}>();

const api = useApi();
const toast = useToast();
const auth = (await api.getSession()) as SessionUser;

export type SessionUser = {
  userId: number;
  username: string;
  role: "USER" | "ADMIN" | string;
  profile: UserProfile;
};

export type UserProfile = {
  UserId: number;
  Username: string;
  EmplId: string;
  Employeename2: string;
  Corporate: string;
  Positionname: string;
  Departmentname: string;
};

const issueTypes = ref([]);
const groups = ref([]);
const employees = ref<any>([]);
const status = ref([]);
const selectedEmployee = ref<{ value: string; label: string } | null>(null);
const loading = ref(false);
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

    console.log("Submitting issue data:", data);
    const response = await api.createIssue(data);

    if (response) {

      console.log("API Response:", response);
      console.log("Issue created successfully:", response);
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

      isOpen.value = false;
      emit("close", true);
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
</script>

<template>
  <UModal v-model:open="isOpen" title="Add Issue" description="Add a New Issue">
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField label="Issue Details" name="issueDetails" required>
          <UTextarea
            v-model="form.issueDetails"
            placeholder="Describe the issue..."
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Action Plan" name="actionPlan">
          <UTextarea
            v-model="form.actionPlan"
            placeholder="Describe the action plan..."
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Issue Type" name="issueTypeId" required>
          <USelect
            class="w-full"
            v-model="form.issueTypeId"
            :items="issueTypes"
            value-key="id"
            label-key="name"
            placeholder="Select issue type"
          />
        </UFormField>

        <UFormField
          label="Responsible Group"
          name="responsibleGroupId"
          required
        >
          <USelect
            class="w-full"
            v-model="form.responsibleGroupId"
            :items="groups"
            value-key="id"
            label-key="name"
            placeholder="Select group"
          />
        </UFormField>

        <UFormField label="Responsible Employee" name="responsibleEmpId">
          <USelectMenu
            class="w-full"
            v-model="selectedEmployee"
            v-model:search-term="search"
            :items="employees"
            placeholder="Type to search employee"
            :searchable="true"
            clear
          >
            <template #empty>
              <div class="flex flex-col items-center justify-center py-6 gap-3">
                <UIcon
                  name="i-heroicons-magnifying-glass"
                  class="w-8 h-8 text-gray-400"
                />
                <p class="text-sm text-gray-500">Type to search employee</p>
              </div>
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField label="Status" name="status" required>
          <USelect
            class="w-full"
            v-model="form.status"
            :items="status"
            value-key="id"
            label-key="name"
            placeholder="Select status"
          />
        </UFormField>

        <div class="flex gap-4 justify-end pt-4">
          <UButton
            type="button"
            variant="ghost"
            @click="isOpen = false"
            :disabled="loading"
          >
            Cancel
          </UButton>
          <UButton type="submit" :loading="loading" variant="solid">
            Create Issue
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

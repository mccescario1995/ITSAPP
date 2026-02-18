<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

definePageMeta({
  title: "Issue Page",
  layout: "sidebar-dashboard",
  middleware: "auth",
});

const api = useApi();
const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id));
const toast = useToast();

const auth = (await api.getSession()) as SessionUser;
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

const { fetchSession } = useAuthStorage();
const userProfile = await fetchSession();

// Issue Locking
const { lockStatus, isEditable: canEditIssue, initLock, cleanup, startHeartbeat } = useIssueLock(id);

// Types
type IssueStatus = {
  id: number;
  name: string;
};

type IssueMessage = {
  id: number;
  issueId: number;
  messageDetail: string;
  createdByUserId: number;
  createdBy: string;
  createdDate: string;
};

// Status color mapping
const statusColorMap: Record<string, any> = {
  OPEN: "primary",
  PARKED: "warning",
  CLOSED: "neutral",
  DROPPED: "error",
};

// State
const issue = ref<any>(null);
const issueStatuses = ref<IssueStatus[]>([]);
const issueMessages = ref<IssueMessage[]>([]);

const loadingIssue = ref(false);
const loadingStatus = ref(false);
const loadingMessages = ref(false);
const submittingReply = ref(false);
const issueLoaded = ref(false);
const selectedStatus = ref<number>(0);
const oldStatus = ref<number>(0);

const replyMessage = ref("");

// Edit mode state
const editingTab = ref<string | null>(null);
const isSaving = ref(false);

// Check if current user owns the issue
const isOwner = computed(() => {
  const issueUserId = issue.value?.createdByUserId ?? issue.value?.Id;
  return issueUserId === auth.userId;
});

// Determine which tab is being edited
const isEditable = computed(() => {
  return editingTab.value !== null;
});

// Fetch issue
const fetchIssue = async () => {
  if (!id.value) return;
  loadingIssue.value = true;
  try {
    const res: any = await api.getIssue(id.value);
    issue.value = (await res.items?.result) ?? null;

    selectedStatus.value = issue?.value?.status || 0;
    oldStatus.value = issue?.value?.status || 0;
  } catch (err) {
    console.error("Failed to fetch issue", err);
    issue.value = null;
  } finally {
    loadingIssue.value = false;
    issueLoaded.value = true;
  }
};

// Fetch statuses
const fetchStatuses = async () => {
  loadingStatus.value = true;
  try {
    const res: any = await api.getStatus();
    issueStatuses.value = res.data?.items ?? [];
  } catch (err) {
    console.error("Failed to fetch statuses", err);
  } finally {
    loadingStatus.value = false;
  }
};

// Fetch messages
const fetchIssueMessages = async () => {
  if (!id.value) return;
  loadingMessages.value = true;

  try {
    const res: any = await api.getIssueMessages(id.value);
    issueMessages.value = res.items ?? [];
  } catch (err) {
    console.error("Failed to fetch issue messages", err);
  } finally {
    loadingMessages.value = false;
  }
};

// Helpers
const getStatusColor = (statusId: number) => {
  const status = issueStatuses.value.find((s) => s.id === statusId);
  const name: any = status?.name.toUpperCase() ?? "";
  return statusColorMap[name] ?? "neutral";
};

const getStatusName = (statusId: number) => {
  return issueStatuses.value.find((s) => s.id === statusId)?.name ?? "Unknown";
};

const formatDate = (date: string) => {
  if (!date) return "";

  const d = new Date(date.includes("T") ? date : date.replace(" ", "T"));

  if (isNaN(d.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

// Edit handlers
const handleEdit = (tab: string) => {
  editingTab.value = tab;
};

const handleSave = async (content: string) => {
  if (!id.value) return;

  isSaving.value = true;
  try {
    const updateData: Record<string, any> = {};

    // Determine which field to update based on the tab
    if (editingTab.value === "details") {
      updateData.issueDetails = content;
    } else if (editingTab.value === "action") {
      updateData.actionPlan = content;
    }

    await api.updateIssue(id.value, updateData);

    toast.add({
      title: "Success",
      description: `Issue ${editingTab.value === "details" ? "details" : "action plan"} updated successfully`,
      icon: "i-lucide-check-circle",
      color: "success",
    });

    // Refresh issue data
    await fetchIssue();
  } catch (err) {
    console.error("Failed to update issue", err);
    toast.add({
      title: "Error",
      description: "Failed to update issue. Please try again.",
      icon: "i-lucide-alert-circle",
      color: "error",
    });
  } finally {
    isSaving.value = false;
    editingTab.value = null;
  }
};

const handleCancel = () => {
  editingTab.value = null;
};

// Submit reply
const submitReply = async () => {
  if (!replyMessage.value.trim() || !id.value) return;

  submittingReply.value = true;
  try {
    await api.addIssueMessage(id.value, {
      messageDetail: replyMessage.value,
      statusId: selectedStatus.value, //{{ auth.profile.Employeename2 }}
      oldStatusId: oldStatus.value,
      createdByUserId: auth.userId,
    });

    replyMessage.value = "";

    await fetchIssueMessages();
    await fetchIssue();
  } catch (err) {
    console.error("Failed to send reply", err);
  } finally {
    submittingReply.value = false;
  }
};

// Auto-scroll to latest message
watch(issueMessages, async () => {
  await nextTick();
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

// Watch route ID change
watch(
  () => route.params.id,
  (val) => {
    if (val) fetchIssue();
  },
  { immediate: true },
);

// Initial fetch
onMounted(() => {
  fetchStatuses();
  fetchIssueMessages();
  fetchIssue();
  initLock();
});

// Cleanup on unmount
onUnmounted(() => {
  cleanup();
});

const items: TabsItem[] = [
  { label: "Issue Details", tab: "details" },
  { label: "Action Plan", tab: "action" },
];

const activeTab = ref("details");

const editIssueLink = computed(() =>
  issue.value ? `/issue/edit/${issue.value.id}` : null,
);
</script>

<template>
  <div>
    

    <div class="mb-6 flex items-center justify-between">
      <div class="flex gap-2">
        <UButton
          @click="router.push('/issue')"
          variant="outline"
          icon="i-lucide-arrow-left"
        >
          Back
        </UButton>
      </div>
      <UButton
        v-if="editIssueLink && canEditIssue"
        :to="editIssueLink"
        color="primary"
        icon="i-lucide-edit-2"
      >
        Edit Issue
      </UButton>
    </div>
<!-- Read-only banner -->
    <UAlert
      v-if="!canEditIssue && lockStatus.isLocked"
      icon="i-lucide-lock"
      title="Read-Only Mode"
      :description="`This issue is being edited by ${lockStatus.lockedBy?.username}`"
      color="warning"
      variant="subtle"
      class="mb-4"
    />

    <!-- Editing banner -->
    <UAlert
      v-if="!canEditIssue && lockStatus.isLocked"
      icon="i-lucide-pen-line"
      title="Edit Mode"
      :description="`This issue is being edited by ${lockStatus.lockedBy?.username}`"
      color="warning"
      variant="subtle"
      class="mb-4"
    />
    <!-- Loading state -->
    <div v-if="loadingIssue">
      <LoadingSpinner />
    </div>

    <div v-else-if="issue" class="space-y-4">
      <h1 class="text-2xl font-semibold mb-4">Issue #{{ issue.id }}</h1>

      <!-- Issue details -->
      <div class="grid grid-cols-2 gap-4">
        <DetailRow label="Status">
          <UBadge
            :color="getStatusColor(issue.status)"
            :label="getStatusName(issue.status)"
          />
        </DetailRow>
        <DetailRow label="User" :value="issue.createdBy" />
      </div>

      <!-- <div class="grid grid-cols-2 gap-4">
        <DetailRow label="Issue Details" :value="issue.issueDetails" />

        <DetailRowMarkup
          label="Action Plan"
          :value="issue.actionPlan || 'No action plan provided'"
        />
      </div> -->

      <div class="grid grid-cols-2 gap-4">
        <DetailRow
          label="Responsible Group"
          :value="issue.responsibleGroupName"
        />
        <DetailRow
          label="Responsible Employee"
          :value="issue.responsibleEmployee || 'Not assigned'"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <DetailRow label="Issue Type" :value="issue.issueType" />
        <DetailRow
          label="Created Date"
          :value="formatDate(issue.createdDate)"
        />
      </div>
    </div>

    <div v-else-if="issueLoaded" class="text-gray-500">Issue not found.</div>

    <!-- Issue Thread -->
    <div class="mt-10">
      <h2 class="text-xl font-semibold mb-4">Issue Thread</h2>

      <div v-if="loadingMessages">
        <LoadingSpinner />
      </div>

      <div v-else class="ms-7 relative border-l border-gray-200 pl-6 space-y-6">
        <UTabs
          v-model:active="activeTab"
          :items="items"
          class="w-full"
          variant="link"
          color="neutral"
        >
          <template #content="{ item }">
            <DetailRowMarkup
              label="Issue Details"
              :value="issue"
              :issue="issue"
              :tab="item.tab"
              :editable="isEditable && editingTab === item.tab"
              :is-owner="isOwner"
              :can-edit="canEditIssue"
              :saving="isSaving"
              @edit="handleEdit"
              @save="handleSave"
              @cancel="handleCancel"
            />
          </template>
        </UTabs>

        <template v-for="msg in issueMessages" :key="msg.id">
          <!-- ===================== -->
          <!-- SYSTEM MESSAGE EVENT -->
          <!-- ===================== -->
          <div
            v-if="msg.createdBy === 'SYSTEM'"
            class="relative -left-[35px] flex items-start gap-3 text-sm text-gray-500"
          >
            <span
              class="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 border"
            >
              <UIcon name="i-lucide-wand" class="text-gray-500" />
            </span>

            <span class="leading-relaxed">
              <span class="font-semibold" v-html="msg.messageDetail" />
              <time class="ml-1 text-xs text-gray-400">
                - {{ formatDate(msg.createdDate) }}
              </time>
            </span>
          </div>

          <!-- ===================== -->
          <!-- NORMAL USER MESSAGE -->
          <!-- ===================== -->
          <div
            v-else
            class="relative -left-[35px] flex items-start gap-3 text-sm text-gray-500 w-full"
          >
            <span
              class="-left-[35px] flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 border"
            >
              <UIcon name="i-lucide-user" class="text-gray-500" />
            </span>

            <div
              class="border rounded-lg shadow-sm w-full"
              :class="
                msg.createdByUserId === auth.userId
                  ? 'bg-blue-50 text-gray-700'
                  : 'bg-yellow-50 text-gray-700 '
              "
            >
              <div
                class="flex items-center justify-between px-4 py-2 border-b rounded-t-lg"
                :class="
                  msg.createdByUserId === auth.userId
                    ? 'bg-blue-100 text-gray-700 '
                    : 'bg-yellow-100 text-gray-700'
                "
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="" />
                  <span class="text-sm font-bold">
                    {{ msg.createdBy }}
                  </span>
                </div>

                <span class="text-xs text-gray-500">
                  {{ formatDate(msg.createdDate) }}
                </span>
              </div>

              <div
                class="px-4 py-3 text-sm text-gray-800 whitespace-pre-line prose prose-sm max-w-none"
                v-html="msg.messageDetail"
              />
            </div>
          </div>
        </template>

        <div v-if="!issueMessages.length" class="text-sm text-gray-500">
          No replies yet.
        </div>
      </div>
    </div>

    <!-- Reply Box -->
    <div class="mt-10 border rounded-lg bg-white shadow-sm">
      <div class="px-4 py-2 border-b bg-gray-50 rounded-t-lg">
        <h3 class="text-sm font-medium">Post a Reply</h3>
      </div>
      <div class="p-4 space-y-3">
        <UTextarea
          class="w-full"
          v-model="replyMessage"
          placeholder="Type your reply here..."
          :disabled="submittingReply"
        />
        <div class="flex justify-between items-center">
          <div>
            <span class="text-sm text-gray-500 font-bold">Issue Status: </span>

            <USelect
              class="md:w-30"
              :items="issueStatuses"
              v-model="selectedStatus"
              value-key="id"
              label-key="name"
            >
            </USelect>
          </div>
          <UButton
            color="primary"
            :loading="submittingReply"
            :disabled="!replyMessage.trim()"
            icon="i-lucide-send"
            @click="submitReply"
          >
            Send Reply
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

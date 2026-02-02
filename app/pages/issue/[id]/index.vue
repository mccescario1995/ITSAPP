<script setup lang="ts">
definePageMeta({
  title: "Issue Page",
  layout: "sidebar-dashboard",
  middleware: "auth",
});

const api = useApi();
const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id));

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

// auth.profile;
// auth.userId;
// auth.role;
// auth.username;


const { fetchSession } = useAuthStorage();
const userProfile = await fetchSession();

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

// Fetch issue
const fetchIssue = async () => {
  if (!id.value) return;
  loadingIssue.value = true;
  try {
    const res: any = await api.getIssue(id.value);
    issue.value = res.items?.result ?? null;

    selectedStatus.value = issue?.value?.status || 0;
    oldStatus.value = issue?.value?.status || 0; // ✅ store original status
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
});
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

      <div class="grid grid-cols-2 gap-4">
        <DetailRow label="Issue Details" :value="issue.issueDetails" />

        <DetailRow
          label="Action Plan"
          :value="issue.actionPlan || 'No action plan provided'"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <DetailRow
          label="Created Date"
          :value="formatDate(issue.createdDate)"
        />
        <DetailRow label="Last Updated" :value="issue.issueType" />
      </div>

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
    </div>

    <div v-else-if="issueLoaded" class="text-gray-500">Issue not found.</div>

    <!-- Issue Thread -->
    <div class="mt-10">
      <h2 class="text-xl font-semibold mb-4">Issue Thread</h2>

      <div v-if="loadingMessages">
        <LoadingSpinner />
      </div>

      <div v-else class="ms-7 relative border-l border-gray-200 pl-6 space-y-6">
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
          <div v-else class="relative">
            <span
              class="absolute -left-[30px] top-5 h-3 w-3 rounded-full bg-primary"
            />

            <div class="bg-white border rounded-lg shadow-sm">
              <div
                class="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="text-gray-500" />
                  <span class="font-medium text-sm font-bold">
                    {{ msg.createdBy }}
                  </span>
                </div>

                <span class="text-xs text-gray-500">
                  {{ formatDate(msg.createdDate) }}
                </span>
              </div>

              <div class="px-4 py-3 text-sm text-gray-800 whitespace-pre-line">
                {{ msg.messageDetail }}
              </div>
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

<!-- Helper component for detail rows -->
<!-- <script setup lang="ts">
const DetailRow = defineProps<{
  label: string;
  value?: string | number;
}>();
</script>

<template #default>
  <div>
    <label class="block text-sm font-medium text-gray-700">{{ label }}</label>
    <p class="mt-1 text-sm text-gray-900"><slot>{{ value }}</slot></p>
  </div>
</template> -->

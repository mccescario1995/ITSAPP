<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui";

const props = defineProps<{
  label: string;
  value?: any;
  issue?: {
    createdBy: string;
    createdDate: string;
    issueDetails: string;
  } | null;
  tab?: any;
  editable?: boolean;
  isOwner?: boolean;
  canEdit?: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: "edit", tab: string): void;
  (e: "save", content: string): void;
  (e: "cancel"): void;
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

// Local edited content state
const editedContent = ref("");

// Get current content based on tab
const currentContent = computed(() => {
  if (props.tab === "details") {
    return props.value?.issueDetails || "";
  }
  return props.value?.actionPlan || "";
});

// Initialize content based on tab
const initializeContent = () => {
  editedContent.value = currentContent.value;
};

// Watch for tab changes - reinitialize content when tab changes
watch(
  () => props.tab,
  () => {
    initializeContent();
  },
  { immediate: true },
);

// Watch for value changes only when NOT editing
watch(
  () => currentContent.value,
  (newContent) => {
    if (!props.editable) {
      editedContent.value = newContent;
    }
  },
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

// Check if user owns this content
const isOwner = computed(() => {
  // Try multiple possible field names for the user ID
  const issueUserId = props.value?.createdByUserId ?? props.value?.Id;
  return issueUserId === auth.userId;
});

// Enter edit mode
const handleEdit = () => {
  initializeContent(); // Ensure content is fresh when entering edit mode
  emit("edit", props.tab);
};
// Save changes
const handleSave = () => {
  emit("save", editedContent.value);
};

// Cancel editing
const handleCancel = () => {
  initializeContent(); // Reset to original content
  emit("cancel");
};

const editorKey = computed(() => `${props.tab}-${props.editable}`);

const editorPlaceholder = computed(() => {
  if (!props.editable) return "";

  return props.tab === "details"
    ? "Enter issue details..."
    : "Enter action plan...";
});

const hasContent = computed(() => {
  return editedContent.value && editedContent.value.trim() !== "";
});

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
        isOwner ? 'bg-blue-50 text-gray-700' : 'bg-yellow-50 text-gray-700'
      "
    >
      <div
        class="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-lg"
        :class="
          isOwner ? 'bg-blue-100 text-gray-700' : 'bg-yellow-100 text-gray-700'
        "
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="text-gray-500" />
          <span class="text-sm font-bold">
            <!-- {{ createdBy }} -->

            {{
              tab === "details"
                ? props.value?.createdBy
                : props.value?.responsibleEmployee
            }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">
            {{ formatDate(createdDate) }}
          </span>

          <!-- Edit button - only shown when user can edit the issue and not already editing -->
          <UButton
            v-if="props.isOwner && props.editable"
            icon="i-lucide-edit-2"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="handleEdit"
          />

          <UBadge v-if="props.editable && hasContent" class="mx-3" color="neutral" icon="i-lucide-pencil-line">Editing ....</UBadge>
        </div>
      </div>
      <div class="px-4 py-3 text-sm text-gray-800">
        <!-- Empty state: only when read-only AND empty -->
        <div
          v-if="!props.editable && !hasContent"
          class="text-gray-400 italic py-2 ps-5"
        >
          {{ props.tab === "details" ? "No issue details" : "No action plan" }}
        </div>

        <!-- Editor: show when editable OR has content -->
        <UEditor
          v-else
          :key="editorKey"
          v-model="editedContent"
          v-slot="{ editor }"
          :editable="props.editable"
          content-type="html"
          :placeholder="editorPlaceholder"
          :class="props.editable ? 'border rounded py-2' : ''"
        >
          <UEditorToolbar
            v-if="props.editable && hasContent"
            :editor="editor"
            :items="toolbarItems"
            class="ps-2"
          />
        </UEditor>
      </div>

      <div class="p-2 flex justify-end">
        <!-- Save and Cancel buttons - shown when editing -->
        <template v-if="props.editable">
          <UButton
            icon="i-lucide-check"
            size="xs"
            color="success"
            :loading="props.saving"
            @click="handleSave"
          >
            Save
          </UButton>
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="ghost"
            color="neutral"
            :disabled="props.saving"
            @click="handleCancel"
          >
            Cancel
          </UButton>
        </template>
      </div>
    </div>
  </div>
</template>

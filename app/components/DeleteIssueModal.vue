<script setup lang="ts">
const props = defineProps<{
  issue: {
    id: number;
    issueDetails: string;
  };
}>();

const emit = defineEmits<{
  close: [boolean];
}>();

const api = useApi();
const toast = useToast();
const loading = ref(false);

const onDelete = async () => {
  loading.value = true;
  try {
    const response = await api.deleteIssue(props.issue.id);

    if (response) {
      toast.add({
        title: "Success",
        description: "Issue deleted successfully",
        color: "success",
      });

      emit("close", true);
    }
  } catch (error) {
    console.error("Failed to delete issue", error);
    toast.add({
      title: "Error",
      description: "Failed to delete issue",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UModal
    title="Delete Issue"
    description="Are you sure you want to delete this issue?"
    :ui="{
      title: 'text-xl sm:text-2xl font-semibold',
      description: 'text-sm sm:text-base',
    }"
  >
    <UButton
      icon="i-lucide-trash"
      color="error"
      variant="solid"
      size="xs"
      aria-label="Delete Issue"
    />
    <template #body>
      <div class="space-y-3 sm:space-y-4 justify-center text-center">
        <UIcon
          name="i-lucide-alert-triangle"
          class="size-24 sm:size-32 lg:size-40 text-error-500 mx-auto sm:hidden md:block"
        />
        <p class="text-base sm:text-lg lg:text-xl text-gray-600 px-2">
          Issue: <strong>{{ issue.issueDetails }}</strong>
        </p>
        <p class="text-sm sm:text-base text-red-600">
          This action cannot be undone.
        </p>
      </div>
    </template>

    <template #footer="{ close }">
      <div
        class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full"
      >
        <UButton
          @click="onDelete"
          :loading="loading"
          variant="solid"
          color="error"
          size="lg"
          class="w-full sm:w-auto"
        >
          Delete
        </UButton>
        <UButton
          @click="close"
          variant="outline"
          size="lg"
          class="w-full sm:w-auto"
        >
          Cancel
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<template>
  <div
    class="flex items-center justify-center"
    :class="{ 'fixed inset-0 bg-white bg-opacity-0 z-50': overlay }"
  >
    <div class="flex flex-col items-center space-y-4">
      <div class="text-gray-600 dark:text-gray-300">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin"
          :class="sizeClasses"
        />
      </div>

      <div
        v-if="message"
        class="text-sm text-gray-600 dark:text-gray-300 text-center"
      >
        {{ message }}
      </div>

      <div
        v-if="showProgress && progress !== null"
        class="w-full max-w-xs space-y-2"
      >
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-300 text-center">
          {{ progress }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  overlay?: boolean;
  showProgress?: boolean;
  progress?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  overlay: false,
  showProgress: false,
  progress: null,
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  return sizes[props.size];
});
</script>

<style scoped></style>

<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

definePageMeta({
  title: "Login",
  layout: "auth",
  middleware: "guest",
});

const api = useApi();
const toast = useToast();
const auth = useAuthStorage();

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  email: "",
  password: "",
});

const show = ref(false);
const loading = ref(false);
const error = ref("");

if (import.meta.client) {
  auth.load();
}

const handleLogin = async ({ data }: FormSubmitEvent<Schema>) => {
  error.value = "";
  loading.value = true;

  try {
    const res: any = await api.login(data.email, data.password);

    if (res.status === "SUCCESS") {
      auth.save(res.Profile);
      await navigateTo("/issue");
    } else {
      error.value = res.message ?? "Login failed";
    }
  } catch (err: any) {
    error.value = err?.data?.message || "Invalid username or password";
  } finally {
    loading.value = false;
    toast.add({
      title: "Login Attempt",
      description: error.value
        ? `Login failed: ${error.value}`
        : "Login process completed.",
      color: error.value ? "error" : "success",
    });
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <UCard class="w-full max-w-md">
      <template #header>
        <h2 class="text-center text-2xl font-bold">Login</h2>
      </template>
      <UForm
        :schema="schema"
        :state="state"
        @submit.prevent="handleLogin"
        class="space-y-4"
      >
        <UFormField size="xl" label="Email" name="email" required>
          <UInput
            class="w-full"
            size="xl"
            v-model="state.email"
            type="email"
            placeholder="Enter your email"
            icon="i-lucide-at-sign"
          />
        </UFormField>

        <UFormField size="xl" label="Password" name="password" required>
          <UInput
            id="password"
            class="w-full"
            size="xl"
            v-model="state.password"
            :type="show ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
            placeholder="Enter your password"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="show ? 'Hide password' : 'Show password'"
                :aria-pressed="show"
                aria-controls="password"
                @click="show = !show"
              />
            </template>
          </UInput>
        </UFormField>

        <UAlert v-if="error" color="error" :title="error" />

        <UButton size="xl" type="submit" :loading="loading" block>
          Login
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

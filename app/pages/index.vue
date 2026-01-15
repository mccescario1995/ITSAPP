
<script setup lang="ts">
definePageMeta({
  title: "Login",
  layout: "auth",
});

const api = useApi();
const email = ref("");
const password = ref("");
const show = ref(false);
const loading = ref(false);
const error = ref("");

const isLoggedIn = computed(() => process.client && !!localStorage.getItem("token"));

const auth = useAuthStorage()

if (import.meta.client) {
  auth.load()
}

const handleLogin = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response: any = await api.login(email.value, password.value);
    if (response.status === "SUCCESS") {
      // Store user data
      localStorage.setItem("userProfile", JSON.stringify(response.objParam1));
      localStorage.setItem("token", response.stringParam1);
      // Redirect to dashboard or home
      await navigateTo("/issue");
    } else {
      error.value = response.message || "Login failed";
    }
  } catch (err) {
    error.value = "An error occurred. Please try again.";
  } finally {
    loading.value = false;
  }
};

</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <UCard class="w-full max-w-md">
      <template #header>
        <h2 class="text-center text-2xl font-bold">Login</h2>
      </template>
      <UForm @submit.prevent="handleLogin" class="space-y-4">
        <UFormField size="xl" label="Email" required>
          <UInput
            class="w-full"
            size="xl"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            icon="i-lucide-at-sign"
          />
        </UFormField>
        <UFormField size="xl" label="Password" required>
          <UInput
            class="w-full"
            size="xl"
            v-model="password"
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
        <UButton size="xl" type="submit" :loading="loading" block>
          {{ loading ? "Logging in..." : "Login" }}
        </UButton>
      </UForm>
      <UAlert v-if="error" color="error" class="mt-4">
        {{ error }}
      </UAlert>
    </UCard>
  </div>
</template>

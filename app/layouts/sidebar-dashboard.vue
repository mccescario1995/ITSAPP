<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible>
      <template #header>
        <h1 class="mx-auto font-bold">ITS</h1>
      </template>

      <UNavigationMenu :items="items[0]" orientation="vertical" />
      <UNavigationMenu
        :items="items[1]"
        orientation="vertical"
        class="mt-auto"
      />
    </UDashboardSidebar>
    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar title="Dashboard">
          <template #leading>
            <UDashboardSidebarCollapse icon="i-lucide-menu" variant="ghost" />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <div class="pt-5 px-6">
          <UApp>
            <slot />
          </UApp>
        </div>
      </template>
    </UDashboardPanel>
    <LoadingSpinner
      v-if="isLoggingOut"
      message="Signing you out..."
      overlay
      size="lg"
    />
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { open } = useSidebar();
const api = useApi();
const toast = useToast();
const auth = useAuthStorage();

const isLoggingOut = ref(false);
const error = ref("");

const handleLogout = async () => {
  try {
    isLoggingOut.value = true;
    setTimeout(async () => {
      try {
        await api.logout();
      } catch (error) {
        console.error("Logout error:", error);
        toast.add({
          title: "Logout Error",
          description: "There was an error signing out. Please try again.",
          color: "error",
        });
      } finally {
        auth.clear();
        await navigateTo("/");
        isLoggingOut.value = false;
        toast.add({
          title: "Logged Out",
          description: "You have been securely logged out.",
          color: "success",
        });
      }
    }, 1000);
  } catch (err) {
    error.value = "Logout failed. Please try again.";
  }
};

const items: NavigationMenuItem[][] = [
  [
    {
      label: "Issues",
      icon: "i-lucide-file-text",
      to: "/issue",
      active: true,
    },
  ],
  [
    {
      label: "Logout",
      icon: "i-lucide-log-out",
      onClick: handleLogout,
    },
  ],
];

defineShortcuts({
  o: () => (open.value = !open.value),
});
</script>

<style lang="css" scoped></style>

// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return; // skip SSR

  const toast = useToast();

  const auth = useAuthStorage();

  // Skip on login page to prevent redirect loops
  if (to.path === "/") return;

  // if (process.client) {
  auth.load();
  // }

  try {
    await auth.fetchSession();
  } catch {
    auth.clear();

    toast.add({
      title: "Session Ended/Expired",
      description: "For your security, please log in again.",
      color: "error",
    });

    return navigateTo("/");
  }

  if (!auth.userProfile.value) {
    toast.add({
      title: "Session Ended/Expired",
      description: "For your security, please log in again.",
      color: "error",
    });
    return navigateTo("/");
  }
});

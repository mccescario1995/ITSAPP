// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStorage();

  // Skip on login page to prevent redirect loops
  if (to.path === "/") {
    return;
  }

  // Load cached session from sessionStorage (for quick UI response)
  if (process.client) {
    auth.load();
  }

  // ALWAYS verify session with server - cached data may be stale
  // This handles cases where server session was invalidated (e.g., API restart)
  try {
    await auth.fetchSession();
  } catch {
    // Server session invalid - clear and redirect to login
    auth.clear();
    return navigateTo("/");
  }

  // Final check - if still no user profile, redirect to login
  if (!auth.userProfile.value) {
    return navigateTo("/");
  }
});

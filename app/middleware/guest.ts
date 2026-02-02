// middleware/guest.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStorage();

  // Skip if already on issue page to prevent redirect loops
  if (to.path === "/issue") {
    return;
  }

  if (process.client) {
    auth.load();
  }

  // Already logged in → go to dashboard
  if (auth.userProfile.value) {
    return navigateTo("/issue");
  }
});

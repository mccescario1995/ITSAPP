
export const useAuthStorage = () => {
  const userProfile = useState<any | null>("auth-profile", () => null);

  const save = (profile: any) => {
    if (!profile) {
      clear();
      return;
    }

    sessionStorage.setItem("userProfile", JSON.stringify(profile));
    userProfile.value = profile;
  };

  const load = () => {
    const raw = sessionStorage.getItem("userProfile");

    if (!raw || raw === "undefined") {
      sessionStorage.removeItem("userProfile");
      userProfile.value = null;
      return;
    }

    try {
      userProfile.value = JSON.parse(raw);
    } catch (err) {
      console.error("Invalid session data", err);
      sessionStorage.removeItem("userProfile");
      userProfile.value = null;
    }
  };

  const clear = () => {
    sessionStorage.removeItem("userProfile");
    userProfile.value = null;
  };

  const fetchSession = async () => {
    const api = useApi();
    try {
      const profile = await api.getSession();
      save(profile);
      return profile;
    } catch (error: any) {
      // Re-throw 401 errors so middleware can handle redirect
      if (error?.statusCode === 401 || error?.status === 401) {
        clear();
        throw error;
      }
      clear();
      throw error;
    }
  };

  return {
    userProfile,
    load,
    save,
    clear,
    fetchSession,
  };
};

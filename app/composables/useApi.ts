class ApiClient {

  private baseApiUrl: string;
  private baseAppUrl: string;

  constructor() {
    this.baseApiUrl = useRuntimeConfig().public.apiUrl;
    this.baseAppUrl = useRuntimeConfig().public.apiUrl;
  }

  async login(email: string, password: string) {
    try {
      const response = await $fetch(`${this.baseApiUrl}/api/Access`, {
        method: 'POST',
        body: { email, password }
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      const response = await $fetch(`${this.baseApiUrl}/api/auth/logout`, {
        method: 'POST'
      });
      // Clear localStorage on successful logout
      localStorage.removeItem("userProfile");
      localStorage.removeItem("token");
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSession() {
    try {
      const response = await $fetch(`${this.baseApiUrl}/api/auth/session`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

async getIssues(params: any) {
  try {
    const cleanedParams: Record<string, string> = {};

    for (const key in params) {
      const value = params[key];

      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "null"
      ) {
        cleanedParams[key] = String(value);
      }
    }

    const query = new URLSearchParams(cleanedParams).toString();

    return await $fetch(
      `${this.baseApiUrl}/api/Issue/list?${query}`,
      { method: "GET" }
    );
  } catch (error) {
    throw error;
  }
}

  // Add other API methods 
}

export const useApi = () => {
  return new ApiClient();
};
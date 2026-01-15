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

 async getIssues(params: any){
    try {
      const query = new URLSearchParams(params).toString();
      const response = await $fetch(`${this.baseApiUrl}/api/Issue/list?${query}`,{
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
  // Add other API methods as needed
}

export const useApi = () => {
  return new ApiClient();
};
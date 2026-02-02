type EmployeeOption = {
  id: number;
  name: string;
};

class ApiClient {
  private baseApiUrl: string;

  constructor() {
    this.baseApiUrl = useRuntimeConfig().public.apiUrl;
  }

  // ======================
  // AUTH / SESSION
  // ======================

  async login(email: string, password: string) {
    return await $fetch(`${this.baseApiUrl}/api/Access/login`, {
      method: "POST",
      body: { email, password },
      credentials: "include", 
    });
  }

  async logout() {
    const response = await $fetch(`${this.baseApiUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    sessionStorage.removeItem("userProfile");
    sessionStorage.removeItem("token");

    return response;
  }

  async getSession() {
    return await $fetch(`${this.baseApiUrl}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
  }

  // ======================
  // ISSUES
  // ======================

  async getIssues(params: any) {
    const cleanedParams: Record<string, string> = {};

    for (const key in params) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== "" && value !== "null") {
        cleanedParams[key] = String(value);
      }
    }

    const query = new URLSearchParams(cleanedParams).toString();

    return await $fetch(`${this.baseApiUrl}/api/Issue/list?${query}`, {
      method: "GET",
      credentials: "include", 
    });
  }

  async getIssue(id: number) {
    return await $fetch(`${this.baseApiUrl}/api/Issue/${id}`, {
      method: "GET",
      credentials: "include",
    });
  }

  async createIssue(data: any) {
    return await $fetch(`${this.baseApiUrl}/api/Issue/create`, {
      method: "POST",
      body: data,
      credentials: "include",
    });
  }

  async updateIssue(id: number, data: any) {
    return await $fetch(`${this.baseApiUrl}/api/Issue/update/${id}`, {
      method: "POST",
      body: data,
      credentials: "include",
    });
  }

  async deleteIssue(id: number) {
    return await $fetch(`${this.baseApiUrl}/api/Issue/delete/${id}`, {
      method: "POST",
      credentials: "include",
    });
  }

  async getIssueMessages(issueId: number) {
    return await $fetch(`${this.baseApiUrl}/api/Issue/${issueId}/messages`, {
      method: "GET",
      credentials: "include",
    });
  }

  async addIssueMessage(issueId: number, body: { messageDetail: string, statusId?: number, oldStatusId?: number, createdByUserId?:number }) {
    return await $fetch(`${this.baseApiUrl}/api/Issue/${issueId}/messages`, { 
      method: "POST",
      body,
      credentials: "include",
    });
  }

  // ======================
  // LOOKUPS
  // ======================

  async getIssueTypes() {
    return await $fetch(`${this.baseApiUrl}/api/Table/get-issue-type`, {
      method: "GET",
      credentials: "include",
    });
  }

  async getGroups() {
    return await $fetch(`${this.baseApiUrl}/api/Table/get-group`, {
      method: "GET",
      credentials: "include",
    });
  }

  async getStatus() {
    return await $fetch(`${this.baseApiUrl}/api/Table/get-status`, {
      method: "GET",
      credentials: "include",
    });
  }

  async searchEmployees(
    query = ""
  ): Promise<{ data: { items: EmployeeOption[] } }> {
    const res: any = await $fetch(
      `${this.baseApiUrl}/api/Table/get-employee?search=${query}`,
      {
        credentials: "include",
      }
    );

    return { data: { items: res.data?.items ?? [] } };
  }
}

export const useApi = () => {
  return new ApiClient();
};

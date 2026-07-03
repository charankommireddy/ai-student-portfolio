import { Project, Certificate, ContactMessage, AuthState, ProfileSettings } from "../types";

const API_BASE = "/api";

// Helper to get Auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("portfolio_admin_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const apiService = {
  // DB connection status
  async getDbStatus(): Promise<{ status: "mongodb" | "local" }> {
    const res = await fetch(`${API_BASE}/db-status`);
    if (!res.ok) throw new Error("Failed to fetch database status");
    return res.json();
  },

  // Auth Operations
  async login(username: string, password: string): Promise<{ token: string; admin: { username: string } }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("portfolio_admin_token", data.token);
    localStorage.setItem("portfolio_admin_user", JSON.stringify(data.admin));
    return data;
  },

  async verifyToken(): Promise<{ admin: { username: string } }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeaders() }
    });

    const data = await res.json();
    if (!res.ok) {
      localStorage.removeItem("portfolio_admin_token");
      localStorage.removeItem("portfolio_admin_user");
      throw new Error(data.message || "Session expired");
    }

    return data;
  },

  logout(): void {
    localStorage.removeItem("portfolio_admin_token");
    localStorage.removeItem("portfolio_admin_user");
  },

  // Projects CRUD
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error("Failed to load projects");
    return res.json();
  },

  async createProject(projectData: Omit<Project, "id">): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(projectData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create project");
    return data;
  },

  async updateProject(id: string, projectData: Partial<Omit<Project, "id">>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(projectData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update project");
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() }
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to delete project");
    }
  },

  // Certificates CRUD
  async getCertificates(): Promise<Certificate[]> {
    const res = await fetch(`${API_BASE}/certificates`);
    if (!res.ok) throw new Error("Failed to load certificates");
    return res.json();
  },

  async createCertificate(certData: Omit<Certificate, "id">): Promise<Certificate> {
    const res = await fetch(`${API_BASE}/certificates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(certData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create certificate");
    return data;
  },

  async updateCertificate(id: string, certData: Partial<Omit<Certificate, "id">>): Promise<Certificate> {
    const res = await fetch(`${API_BASE}/certificates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(certData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update certificate");
    return data;
  },

  async deleteCertificate(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/certificates/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() }
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to delete certificate");
    }
  },

  // Contact Form Submission
  async sendContactMessage(name: string, email: string, subject: string, message: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit message");
    return data;
  },

  async getContactMessages(): Promise<ContactMessage[]> {
    const res = await fetch(`${API_BASE}/contact`, {
      headers: { ...getAuthHeaders() }
    });

    if (!res.ok) throw new Error("Failed to load messages");
    return res.json();
  },

  async deleteContactMessage(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/contact/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() }
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to delete message");
    }
  },

  // Profile Settings Operations
  async getSettings(): Promise<ProfileSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error("Failed to load profile settings");
    return res.json();
  },

  async updateSettings(settingsData: ProfileSettings): Promise<ProfileSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(settingsData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update profile settings");
    return data;
  },

  // GitHub Proxy
  async getGithubRepos(username?: string): Promise<any[]> {
    const url = username ? `${API_BASE}/github/repos?username=${encodeURIComponent(username)}` : `${API_BASE}/github/repos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load GitHub repositories");
    return res.json();
  }
};

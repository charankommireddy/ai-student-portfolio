export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubLink?: string;
  liveDemoLink?: string;
  projectImage?: string;
  category: string;
  date: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuingOrganization: string;
  date: string;
  credentialLink?: string;
  credentialId?: string;
  category?: string;
  image?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

export interface AuthState {
  token: string | null;
  admin: { username: string } | null;
}

export interface ProfileSettings {
  fullName: string;
  role: string;
  aboutText: string;
  avatarUrl: string;
  skills: { category: string; list: string[] }[];
  resumePdf?: string;
  resumeDetails?: {
    education: { institution: string; degree: string; period: string; details?: string; coursework?: string }[];
    experience: { company: string; role: string; period: string; details?: string }[];
  };
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    email?: string;
  };
  codingProfiles: {
    githubUsername?: string;
    leetcodeUsername?: string;
    hackerrankUsername?: string;
  };
}

export type ProjectCategory = "All" | "AI/ML" | "Full Stack" | "Data Science" | "Mobile" | "Other";

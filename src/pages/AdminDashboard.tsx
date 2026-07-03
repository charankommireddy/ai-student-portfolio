import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit, MessageSquare, Award, FolderPlus, 
  LogIn, ShieldCheck, Mail, Calendar, Eye, Trash, 
  DatabaseZap, ExternalLink, RefreshCw, Upload, X, Wrench, User, Globe, FileText, CheckCircle, BrainCircuit
} from "lucide-react";
import { Project, Certificate, ContactMessage, ProfileSettings } from "../types";
import { apiService } from "../services/api";

interface AdminDashboardProps {
  onAddToast: (text: string, type: "success" | "error" | "info") => void;
  projects: Project[];
  certificates: Certificate[];
  settings: ProfileSettings | null;
  onRefreshData: () => Promise<void>;
  dbStatus: "mongodb" | "local";
}

export default function AdminDashboard({
  onAddToast,
  projects,
  certificates,
  settings,
  onRefreshData,
  dbStatus
}: AdminDashboardProps) {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"projects" | "certificates" | "messages" | "settings">("projects");

  // Contact messages logs
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  // Modal / Form state for Projects
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  const [projForm, setProjForm] = useState({
    title: "",
    description: "",
    technologies: "",
    githubLink: "",
    liveDemoLink: "",
    projectImage: "",
    category: "AI/ML",
    date: ""
  });
  const [isProjSubmitting, setIsProjSubmitting] = useState(false);

  // Form state for Certificates
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [certForm, setCertForm] = useState({
    name: "",
    issuingOrganization: "",
    date: "",
    credentialLink: "",
    credentialId: "",
    category: "",
    image: ""
  });
  const [isCertSubmitting, setIsCertSubmitting] = useState(false);

  // Form state for dynamic settings
  const [settingsForm, setSettingsForm] = useState<ProfileSettings>({
    fullName: "",
    role: "",
    aboutText: "",
    avatarUrl: "",
    skills: [],
    resumePdf: "",
    resumeDetails: { education: [], experience: [] },
    socialLinks: { linkedin: "", github: "", twitter: "", email: "" },
    codingProfiles: { githubUsername: "", leetcodeUsername: "", hackerrankUsername: "" }
  });
  const [isSettingsSubmitting, setIsSettingsSubmitting] = useState(false);

  // New Skills Category input state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSkillNames, setNewSkillNames] = useState<{ [key: number]: string }>({});

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem("portfolio_admin_token");
    if (token) {
      apiService.verifyToken()
        .then(() => {
          setIsLoggedIn(true);
        })
        .catch(() => {
          setIsLoggedIn(false);
          onAddToast("Admin session expired. Please log in again.", "info");
        });
    }
  }, []);

  // Fetch messages if logged in
  useEffect(() => {
    if (isLoggedIn && activeTab === "messages") {
      fetchMessages();
    }
  }, [isLoggedIn, activeTab]);

  // Load settings into form state
  useEffect(() => {
    if (settings) {
      setSettingsForm({
        fullName: settings.fullName || "",
        role: settings.role || "",
        aboutText: settings.aboutText || "",
        avatarUrl: settings.avatarUrl || "",
        skills: settings.skills || [],
        resumePdf: settings.resumePdf || "",
        resumeDetails: settings.resumeDetails || { education: [], experience: [] },
        socialLinks: settings.socialLinks || { linkedin: "", github: "", twitter: "", email: "" },
        codingProfiles: settings.codingProfiles || { githubUsername: "", leetcodeUsername: "", hackerrankUsername: "" }
      });
    }
  }, [settings]);

  const fetchMessages = async () => {
    setIsMessagesLoading(true);
    try {
      const data = await apiService.getContactMessages();
      setMessages(data);
    } catch (err: any) {
      onAddToast("Failed to fetch inbox messages.", "error");
    } finally {
      setIsMessagesLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      onAddToast("Please fill in both fields.", "error");
      return;
    }

    setIsLoggingIn(true);
    try {
      await apiService.login(username, password);
      setIsLoggedIn(true);
      onAddToast("Access authorized. Welcome, Administrator.", "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message || "Invalid credentials provided.", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle base64 image upload on client
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "project" | "avatar" | "resume" | "certificate") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === "project") {
        setProjForm({ ...projForm, projectImage: base64 });
        onAddToast("Project visual thumbnail preloaded locally.", "info");
      } else if (target === "avatar") {
        setSettingsForm({ ...settingsForm, avatarUrl: base64 });
        onAddToast("New profile picture loaded.", "info");
      } else if (target === "resume") {
        setSettingsForm({ ...settingsForm, resumePdf: base64 });
        onAddToast("ATS PDF resume document uploaded.", "info");
      } else if (target === "certificate") {
        setCertForm({ ...certForm, image: base64 });
        onAddToast("Certificate credential image loaded.", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  // Create or Update Project
  const handleProjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, description, technologies, githubLink, liveDemoLink, projectImage, category, date } = projForm;

    if (!title || !description || !technologies || !category || !date) {
      onAddToast("Please fill in all mandatory fields.", "error");
      return;
    }

    const techArray = technologies.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    setIsProjSubmitting(true);

    try {
      if (editingProj) {
        await apiService.updateProject(editingProj.id, {
          title,
          description,
          technologies: techArray,
          githubLink,
          liveDemoLink,
          projectImage,
          category,
          date
        });
        onAddToast("Project updated successfully!", "success");
      } else {
        await apiService.createProject({
          title,
          description,
          technologies: techArray,
          githubLink,
          liveDemoLink,
          projectImage,
          category,
          date
        });
        onAddToast("New project registered successfully!", "success");
      }
      setIsProjModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message || "Failed to submit project.", "error");
    } finally {
      setIsProjSubmitting(false);
    }
  };

  const handleDeleteProj = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await apiService.deleteProject(id);
      onAddToast("Project successfully removed.", "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast("Failed to delete project.", "error");
    }
  };

  const openProjectModal = (proj: Project | null = null) => {
    if (proj) {
      setEditingProj(proj);
      setProjForm({
        title: proj.title,
        description: proj.description,
        technologies: proj.technologies.join(", "),
        githubLink: proj.githubLink || "",
        liveDemoLink: proj.liveDemoLink || "",
        projectImage: proj.projectImage || "",
        category: proj.category,
        date: proj.date
      });
    } else {
      setEditingProj(null);
      setProjForm({
        title: "",
        description: "",
        technologies: "",
        githubLink: "",
        liveDemoLink: "",
        projectImage: "",
        category: "AI/ML",
        date: new Date().toISOString().substring(0, 10)
      });
    }
    setIsProjModalOpen(true);
  };

  // Add/Edit Certification
  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, issuingOrganization, date, credentialLink, credentialId, category, image } = certForm;

    if (!name || !issuingOrganization || !date) {
      onAddToast("Please fill in name, issuer, and date fields.", "error");
      return;
    }

    setIsCertSubmitting(true);
    try {
      if (editingCert) {
        await apiService.updateCertificate(editingCert.id, {
          name,
          issuingOrganization,
          date,
          credentialLink,
          credentialId,
          category,
          image
        });
        onAddToast("Certification updated successfully!", "success");
      } else {
        await apiService.createCertificate({
          name,
          issuingOrganization,
          date,
          credentialLink,
          credentialId,
          category,
          image
        });
        onAddToast("Certification registered successfully!", "success");
      }
      setIsCertModalOpen(false);
      setEditingCert(null);
      setCertForm({ name: "", issuingOrganization: "", date: "", credentialLink: "", credentialId: "", category: "", image: "" });
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message || "Failed to submit certification.", "error");
    } finally {
      setIsCertSubmitting(false);
    }
  };

  const openCertModal = (cert: Certificate | null = null) => {
    if (cert) {
      setEditingCert(cert);
      setCertForm({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
        date: cert.date,
        credentialLink: cert.credentialLink || "",
        credentialId: cert.credentialId || "",
        category: cert.category || "",
        image: cert.image || ""
      });
    } else {
      setEditingCert(null);
      setCertForm({
        name: "",
        issuingOrganization: "",
        date: new Date().toISOString().substring(0, 7), // YYYY-MM
        credentialLink: "",
        credentialId: "",
        category: "",
        image: ""
      });
    }
    setIsCertModalOpen(true);
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) return;
    try {
      await apiService.deleteCertificate(id);
      onAddToast("Certification successfully deleted.", "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast("Failed to delete certificate.", "error");
    }
  };

  // Message Inbox Handlers
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Delete this inbox message?")) return;
    try {
      await apiService.deleteContactMessage(id);
      onAddToast("Message cleared from inbox.", "success");
      fetchMessages();
    } catch (err: any) {
      onAddToast("Failed to clear message.", "error");
    }
  };

  // Dynamic Profile/Settings handlers
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsSubmitting(true);
    try {
      await apiService.updateSettings(settingsForm);
      onAddToast("Portfolio settings updated successfully and synced to database!", "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message || "Failed to update portfolio settings.", "error");
    } finally {
      setIsSettingsSubmitting(false);
    }
  };

  // Settings: Add skill category
  const handleAddSkillCategory = () => {
    if (!newCategoryName.trim()) return;
    const updatedSkills = [...settingsForm.skills, { category: newCategoryName.trim(), list: [] }];
    setSettingsForm({ ...settingsForm, skills: updatedSkills });
    setNewCategoryName("");
    onAddToast("Skills category added.", "success");
  };

  // Settings: Delete skill category
  const handleDeleteSkillCategory = (catIdx: number) => {
    const updatedSkills = settingsForm.skills.filter((_, idx) => idx !== catIdx);
    setSettingsForm({ ...settingsForm, skills: updatedSkills });
    onAddToast("Skills category removed.", "info");
  };

  // Settings: Add skill item
  const handleAddSkillItem = (catIdx: number) => {
    const skillName = newSkillNames[catIdx];
    if (!skillName || !skillName.trim()) return;

    const updatedSkills = [...settingsForm.skills];
    updatedSkills[catIdx].list = [...updatedSkills[catIdx].list, skillName.trim()];

    setSettingsForm({ ...settingsForm, skills: updatedSkills });
    setNewSkillNames({ ...newSkillNames, [catIdx]: "" });
    onAddToast("Skill added.", "success");
  };

  // Settings: Delete skill item
  const handleDeleteSkillItem = (catIdx: number, skillIdx: number) => {
    const updatedSkills = [...settingsForm.skills];
    updatedSkills[catIdx].list = updatedSkills[catIdx].list.filter((_, idx) => idx !== skillIdx);
    setSettingsForm({ ...settingsForm, skills: updatedSkills });
  };

  // Settings: Add education timeline item
  const handleAddEducation = () => {
    const currentEdu = settingsForm.resumeDetails?.education || [];
    const updatedEdu = [
      ...currentEdu,
      { institution: "New University Name", degree: "Degree / Course Name", period: "2024 - Present", details: "", coursework: "" }
    ];
    setSettingsForm({
      ...settingsForm,
      resumeDetails: {
        ...settingsForm.resumeDetails,
        education: updatedEdu,
        experience: settingsForm.resumeDetails?.experience || []
      }
    });
  };

  // Settings: Edit education timeline item
  const handleEditEducation = (idx: number, field: string, val: string) => {
    const updatedEdu = [...(settingsForm.resumeDetails?.education || [])];
    updatedEdu[idx] = { ...updatedEdu[idx], [field]: val };
    setSettingsForm({
      ...settingsForm,
      resumeDetails: {
        ...settingsForm.resumeDetails,
        education: updatedEdu,
        experience: settingsForm.resumeDetails?.experience || []
      }
    });
  };

  // Settings: Delete education timeline item
  const handleDeleteEducation = (idx: number) => {
    const updatedEdu = (settingsForm.resumeDetails?.education || []).filter((_, i) => i !== idx);
    setSettingsForm({
      ...settingsForm,
      resumeDetails: {
        ...settingsForm.resumeDetails,
        education: updatedEdu,
        experience: settingsForm.resumeDetails?.experience || []
      }
    });
  };

  // Settings: Add experience timeline item
  const handleAddExperience = () => {
    const currentExp = settingsForm.resumeDetails?.experience || [];
    const updatedExp = [
      ...currentExp,
      { company: "Company Name", role: "Role / Project Position", period: "2024 - Present", details: "" }
    ];
    setSettingsForm({
      ...settingsForm,
      resumeDetails: {
        ...settingsForm.resumeDetails,
        experience: updatedExp,
        education: settingsForm.resumeDetails?.education || []
      }
    });
  };

  // Settings: Edit experience timeline item
  const handleEditExperience = (idx: number, field: string, val: string) => {
    const updatedExp = [...(settingsForm.resumeDetails?.experience || [])];
    updatedExp[idx] = { ...updatedExp[idx], [field]: val };
    setSettingsForm({
      ...settingsForm,
      resumeDetails: {
        ...settingsForm.resumeDetails,
        experience: updatedExp,
        education: settingsForm.resumeDetails?.education || []
      }
    });
  };

  // Settings: Delete experience timeline item
  const handleDeleteExperience = (idx: number) => {
    const updatedExp = (settingsForm.resumeDetails?.experience || []).filter((_, i) => i !== idx);
    setSettingsForm({
      ...settingsForm,
      resumeDetails: {
        ...settingsForm.resumeDetails,
        experience: updatedExp,
        education: settingsForm.resumeDetails?.education || []
      }
    });
  };

  // If NOT Logged In: Render Elegant Login Form
  if (!isLoggedIn) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 min-h-screen flex items-center justify-center p-4">
        
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="glass-card max-w-sm w-full p-8 rounded-3xl space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="p-3 bg-violet-600/10 dark:bg-violet-400/10 rounded-2xl text-violet-600 dark:text-violet-400 inline-block">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-zinc-900 dark:text-white">Admin Portal</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Provide credential keys to customize portfolio records.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold font-mono text-zinc-500" htmlFor="admin-user">Username</label>
              <input
                id="admin-user"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-900/30 focus:outline-none focus:border-violet-500 transition-all font-sans font-medium text-zinc-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold font-mono text-zinc-500" htmlFor="admin-pass">Password</label>
              <input
                id="admin-pass"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-900/30 focus:outline-none focus:border-violet-500 transition-all font-sans text-zinc-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex items-center justify-center gap-2 w-full py-3 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer hover:shadow-lg disabled:opacity-50 transition-all font-mono"
            >
              {isLoggingIn ? (
                <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Authorize Access</span>
              )}
            </button>
          </form>

          {/* Sandbox mode notice */}
          <div className="p-3.5 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200/20 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <DatabaseZap className="w-3.5 h-3.5 text-amber-500" />
              <span>Sandbox mode active:</span>
            </p>
            <p className="mt-1">
              If not connected to MongoDB Atlas, use default login keys <strong className="font-mono text-violet-500">admin</strong> / <strong className="font-mono text-violet-500">admin123</strong> to browse dashboard utilities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 min-h-screen pt-24 px-4 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-xs uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Security Panel Authorized</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white">
              Portfolio Control Panel
            </h1>
          </div>

          {/* Connection Status Label */}
          <div className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-xs font-mono">
            <DatabaseZap className={`w-4 h-4 ${dbStatus === "mongodb" ? "text-emerald-500" : "text-amber-500 animate-pulse"}`} />
            <span className="text-zinc-400 uppercase font-semibold">DB Mode:</span>
            <span className="text-zinc-700 dark:text-zinc-200 font-bold">
              {dbStatus === "mongodb" ? "MongoDB Atlas" : "Local JSON Sandbox"}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-900 pb-px overflow-x-auto">
          {[
            { id: "projects", label: "Projects", icon: <FolderPlus className="w-4 h-4" /> },
            { id: "certificates", label: "Certifications", icon: <Award className="w-4 h-4" /> },
            { id: "settings", label: "Profile & Settings", icon: <Wrench className="w-4 h-4" /> },
            { id: "messages", label: "Messages Inbox", icon: <MessageSquare className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4.5 py-3 border-b-2 text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-violet-600 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* --- ACTIVE TAB DISPLAY CONTENT --- */}
        
        {/* 1. PROJECTS TAB PANEL */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You have <strong className="font-mono text-violet-500 font-bold">{projects.length}</strong> project records registered in the database.
              </p>
              <button
                onClick={() => openProjectModal()}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer shadow-md shadow-violet-600/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            {/* Project Admin Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div key={proj.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-zinc-200/50 dark:border-zinc-800/40 shadow-lg">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-semibold">
                        {proj.category}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">{proj.date}</span>
                    </div>
                    <h3 className="font-display font-bold text-md text-zinc-950 dark:text-white line-clamp-1">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  {/* Actions bar */}
                  <div className="px-5 py-4 bg-zinc-50/50 dark:bg-zinc-950/40 border-t border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-400">ID: {proj.id.substring(0, 8)}...</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openProjectModal(proj)}
                        className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                        title="Edit Project"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProj(proj.id)}
                        className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        title="Delete Project"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CERTIFICATIONS TAB PANEL */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You have <strong className="font-mono text-violet-500 font-bold">{certificates.length}</strong> certification logs registered.
              </p>
              <button
                onClick={() => openCertModal(null)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer shadow-md shadow-violet-600/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Certification</span>
              </button>
            </div>

            {/* Certifications list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div key={cert.id} className="glass-card rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/40 flex flex-col justify-between h-full">
                  {cert.image && (
                    <div className="relative h-40 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200/30 dark:border-zinc-800/30">
                      <img
                        src={cert.image}
                        alt={cert.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-grow space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>{cert.issuingOrganization}</span>
                      <span>{cert.date}</span>
                    </div>
                    {cert.category && (
                      <span className="inline-block text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-semibold">
                        {cert.category}
                      </span>
                    )}
                    <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white line-clamp-2">
                      {cert.name}
                    </h3>
                    {cert.credentialId && (
                      <p className="text-[11px] font-mono text-zinc-400">
                        ID: <span className="text-zinc-500 dark:text-zinc-300">{cert.credentialId}</span>
                      </p>
                    )}
                  </div>

                  <div className="p-5 pt-4 bg-zinc-50/50 dark:bg-zinc-950/40 border-t border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-400">DB ID: {cert.id.substring(0, 6)}...</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openCertModal(cert)}
                        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                        title="Edit Certification"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCert(cert.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        title="Delete Certification"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. PROFILE & SETTINGS TAB PANEL */}
        {activeTab === "settings" && (
          <form onSubmit={handleSettingsSubmit} className="space-y-8 max-w-4xl mx-auto">
            
            {/* Form actions floating banner */}
            <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-violet-500" />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
                  You are editing dynamic global parameters. Click <strong>Save Portfolio Changes</strong> to sync to the database.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSettingsSubmitting}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md disabled:opacity-50 transition-all shrink-0 cursor-pointer"
              >
                {isSettingsSubmitting ? "Saving..." : "Save Portfolio Changes"}
              </button>
            </div>

            {/* Block 1: Profile bio details */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="font-display font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-violet-500" />
                <span>1. Core Profile Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.fullName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400">Professional Role / Focus Area</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.role}
                    onChange={(e) => setSettingsForm({ ...settingsForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400">About Me Text / Personal Bio</label>
                <textarea
                  rows={4}
                  required
                  value={settingsForm.aboutText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, aboutText: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium leading-relaxed text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400">Profile picture / avatar (Base64 file or direct URL)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={settingsForm.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border border-zinc-200/50 dark:border-zinc-800/40 shadow-inner"
                  />
                  <div className="flex-grow w-full space-y-2">
                    <input
                      type="text"
                      placeholder="Or paste profile image direct URL..."
                      value={settingsForm.avatarUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, avatarUrl: e.target.value })}
                      className="w-full px-4 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-mono font-bold cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, "avatar")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">PNG/JPG under 1MB recommended.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Categorized Skills List Editor */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="font-display font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-violet-500" />
                <span>2. Categorized Skillsets Manager</span>
              </h3>

              <div className="space-y-4">
                {settingsForm.skills.map((cat, catIdx) => (
                  <div key={catIdx} className="p-4 rounded-2xl bg-zinc-100/40 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold uppercase text-violet-600 dark:text-violet-400">{cat.category}</h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkillCategory(catIdx)}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Render existing skills lists */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {cat.list.map((skillItem, skillIdx) => (
                        <span key={skillIdx} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-[11px] font-mono rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300">
                          <span>{skillItem}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkillItem(catIdx, skillIdx)}
                            className="p-0.5 rounded text-zinc-400 hover:text-red-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {cat.list.length === 0 && <span className="text-[10px] text-zinc-400 font-mono italic">No skill items. Add some below.</span>}
                    </div>

                    {/* Add skill item inside category */}
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Type skill name..."
                        value={newSkillNames[catIdx] || ""}
                        onChange={(e) => setNewSkillNames({ ...newSkillNames, [catIdx]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkillItem(catIdx);
                          }
                        }}
                        className="flex-grow px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillItem(catIdx)}
                        className="px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer"
                      >
                        Add Skill
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new category header */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="New Category (e.g. AI/ML, DevOps)..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-grow px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-100/50 dark:bg-zinc-900/30 text-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkillCategory}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-lg bg-violet-600 text-white cursor-pointer hover:bg-violet-700 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Category</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Block 3: Social & Coding Coordinates */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="font-display font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-500" />
                <span>3. Social Coordinates & Coding Profiles</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-violet-600 dark:text-violet-400">Social Networks</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono text-zinc-500">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={settingsForm.socialLinks.linkedin}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        socialLinks: { ...settingsForm.socialLinks, linkedin: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono text-zinc-500">GitHub Profile URL</label>
                    <input
                      type="url"
                      value={settingsForm.socialLinks.github}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        socialLinks: { ...settingsForm.socialLinks, github: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono text-zinc-500">Email Address</label>
                    <input
                      type="email"
                      value={settingsForm.socialLinks.email}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        socialLinks: { ...settingsForm.socialLinks, email: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-violet-600 dark:text-violet-400">Coding Profiles Usernames</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono text-zinc-500">GitHub Username (feeds live repos)</label>
                    <input
                      type="text"
                      value={settingsForm.codingProfiles.githubUsername}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        codingProfiles: { ...settingsForm.codingProfiles, githubUsername: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono text-zinc-500">LeetCode Username</label>
                    <input
                      type="text"
                      value={settingsForm.codingProfiles.leetcodeUsername}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        codingProfiles: { ...settingsForm.codingProfiles, leetcodeUsername: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono text-zinc-500">HackerRank Username</label>
                    <input
                      type="text"
                      value={settingsForm.codingProfiles.hackerrankUsername}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        codingProfiles: { ...settingsForm.codingProfiles, hackerrankUsername: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-xs font-medium text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Block 4: Resume ATS Timeline & PDF File Upload */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="font-display font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                <span>4. Resume details & PDF Manager</span>
              </h3>

              {/* Education list manager */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-violet-600 dark:text-violet-400">Academic Education History</h4>
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg border border-violet-500/20 text-violet-600 bg-violet-600/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add School</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(settingsForm.resumeDetails?.education || []).map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(idx)}
                        className="absolute top-4 right-4 p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Institution Name</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleEditEducation(idx, "institution", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Degree / Qualification</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleEditEducation(idx, "degree", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Calendar Period (e.g. 2023 - 2027)</label>
                          <input
                            type="text"
                            value={edu.period}
                            onChange={(e) => handleEditEducation(idx, "period", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Grade details (GPA/Percent)</label>
                          <input
                            type="text"
                            value={edu.details || ""}
                            onChange={(e) => handleEditEducation(idx, "details", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-400">Relevant Coursework</label>
                          <input
                            type="text"
                            placeholder="e.g. Data Structures, Algorithms, Neural Networks"
                            value={edu.coursework || ""}
                            onChange={(e) => handleEditEducation(idx, "coursework", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience list manager */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-violet-600 dark:text-violet-400">Work & Project Milestones</h4>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg border border-violet-500/20 text-violet-600 bg-violet-600/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Experience</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(settingsForm.resumeDetails?.experience || []).map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(idx)}
                        className="absolute top-4 right-4 p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Company Name / Research Lab</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleEditExperience(idx, "company", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Role Title</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => handleEditExperience(idx, "role", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Calendar Period (e.g. 2024 - Present)</label>
                          <input
                            type="text"
                            value={exp.period}
                            onChange={(e) => handleEditExperience(idx, "period", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400">Summary Details</label>
                          <input
                            type="text"
                            value={exp.details || ""}
                            onChange={(e) => handleEditExperience(idx, "details", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume PDF document manager */}
              <div className="space-y-3 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <label className="text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400">Direct Resume PDF file (Base64 file or direct URL)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Or paste direct Resume PDF URL (e.g. GDrive public link)..."
                    value={settingsForm.resumePdf}
                    onChange={(e) => setSettingsForm({ ...settingsForm, resumePdf: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-mono font-bold cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Upload PDF document</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleImageFileChange(e, "resume")}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Upload PDF to bind custom Curriculum Vitae document.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Save trigger bottom */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="submit"
                disabled={isSettingsSubmitting}
                className="px-6 py-3 text-xs font-extrabold font-mono tracking-wider uppercase rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {isSettingsSubmitting ? "Saving changes..." : "Save Portfolio Changes"}
              </button>
            </div>
          </form>
        )}

        {/* 4. MESSAGES INBOX PANEL */}
        {activeTab === "messages" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You have <strong className="font-mono text-violet-500 font-bold">{messages.length}</strong> submitted messages logs.
              </p>
              <button
                onClick={fetchMessages}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 cursor-pointer text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Inbox</span>
              </button>
            </div>

            {isMessagesLoading ? (
              <div className="flex items-center justify-center py-20 gap-2">
                <div className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="glass-card rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">{msg.name}</h3>
                          <span className="text-[10px] font-mono text-zinc-400">({msg.email})</span>
                        </div>
                        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 font-mono">{msg.subject}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{msg.date ? new Date(msg.date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "Recently"}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                          title="Delete message"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed bg-zinc-100/30 dark:bg-zinc-950/20 p-4 rounded-xl border border-zinc-200/20">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card text-center py-20 rounded-2xl max-w-md mx-auto space-y-3">
                <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="font-display font-semibold text-zinc-800 dark:text-zinc-200">Inbox is empty</p>
                <p className="text-xs text-zinc-400">All submitted messages will appear here after they are sent from the frontpage.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- ADD/EDIT PROJECT MODAL OVERLAY --- */}
      {isProjModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-5 relative shadow-2xl border border-white/20">
            <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
              <h3 className="font-display font-bold text-md sm:text-lg text-zinc-900 dark:text-white">
                {editingProj ? "Edit Project Details" : "Register New Code Project"}
              </h3>
              <button
                onClick={() => setIsProjModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProjSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="p-title">Project Title *</label>
                <input
                  id="p-title"
                  type="text"
                  required
                  placeholder="e.g. AI Coding Assistant"
                  value={projForm.title}
                  onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="p-cat">Category *</label>
                  <select
                    id="p-cat"
                    value={projForm.category}
                    onChange={(e) => setProjForm({ ...projForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  >
                    <option value="AI/ML">AI/ML</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="p-date">Completion Date *</label>
                  <input
                    id="p-date"
                    type="date"
                    required
                    value={projForm.date}
                    onChange={(e) => setProjForm({ ...projForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="p-desc">Description Summary *</label>
                <textarea
                  id="p-desc"
                  rows={3}
                  required
                  placeholder="Summarize code architecture, objectives, and dynamic modules..."
                  value={projForm.description}
                  onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="p-tech">Technologies used (Comma Separated) *</label>
                <input
                  id="p-tech"
                  type="text"
                  required
                  placeholder="React, Express, PyTorch, MongoDB"
                  value={projForm.technologies}
                  onChange={(e) => setProjForm({ ...projForm, technologies: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="p-git">GitHub Repository URL</label>
                  <input
                    id="p-git"
                    type="url"
                    placeholder="https://github.com/..."
                    value={projForm.githubLink}
                    onChange={(e) => setProjForm({ ...projForm, githubLink: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="p-live">Live Deployment URL</label>
                  <input
                    id="p-live"
                    type="url"
                    placeholder="https://demo.app/..."
                    value={projForm.liveDemoLink}
                    onChange={(e) => setProjForm({ ...projForm, liveDemoLink: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Project Image Preview & File paste */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold font-mono text-zinc-500">Project Cover Image (Base64 file or direct URL)</label>
                <input
                  type="text"
                  placeholder="Or paste direct image URL..."
                  value={projForm.projectImage}
                  onChange={(e) => setProjForm({ ...projForm, projectImage: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                />
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-mono font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, "project")}
                      className="hidden"
                    />
                  </label>
                  {projForm.projectImage && (
                    <span className="text-[10px] font-mono text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Image loaded</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setIsProjModalOpen(false)}
                  className="px-4.5 py-2.5 font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProjSubmitting}
                  className="px-4.5 py-2.5 font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isProjSubmitting ? "Saving..." : editingProj ? "Update Project" : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT CERTIFICATION MODAL OVERLAY --- */}
      {isCertModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 relative shadow-2xl border border-white/20 my-8">
            <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
              <h3 className="font-display font-bold text-md text-zinc-900 dark:text-white">
                {editingCert ? "Edit Industry Certification" : "Add Industry Certification"}
              </h3>
              <button
                onClick={() => setIsCertModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCertSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="cert-name">Certification Name *</label>
                <input
                  id="cert-name"
                  type="text"
                  required
                  placeholder="e.g. TensorFlow Developer Certificate"
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="cert-org">Issuing Organization / Issuer *</label>
                <input
                  id="cert-org"
                  type="text"
                  required
                  placeholder="DeepLearning.AI / Google"
                  value={certForm.issuingOrganization}
                  onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="cert-date">Issue Date *</label>
                  <input
                    id="cert-date"
                    type="month"
                    required
                    value={certForm.date}
                    onChange={(e) => setCertForm({ ...certForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-700 dark:text-zinc-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="cert-category">Category</label>
                  <input
                    id="cert-category"
                    type="text"
                    placeholder="e.g. Cloud / AI / Security"
                    value={certForm.category}
                    onChange={(e) => setCertForm({ ...certForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="cert-id">Credential ID</label>
                  <input
                    id="cert-id"
                    type="text"
                    placeholder="e.g. CRED-12345"
                    value={certForm.credentialId}
                    onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500" htmlFor="cert-link">Credential URL</label>
                  <input
                    id="cert-link"
                    type="url"
                    placeholder="https://coursera.org/verify/..."
                    value={certForm.credentialLink}
                    onChange={(e) => setCertForm({ ...certForm, credentialLink: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Certificate Image Preview & File upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold font-mono text-zinc-500">Certificate Image (Base64 file or direct URL)</label>
                <input
                  type="text"
                  placeholder="Or paste direct image URL..."
                  value={certForm.image}
                  onChange={(e) => setCertForm({ ...certForm, image: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                />
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-mono font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, "certificate")}
                      className="hidden"
                    />
                  </label>
                  {certForm.image && (
                    <span className="text-[10px] font-mono text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Image loaded</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4.5 py-2.5 font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCertSubmitting}
                  className="px-4.5 py-2.5 font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer text-xs"
                >
                  {isCertSubmitting ? "Saving..." : editingCert ? "Update Certification" : "Add Certification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

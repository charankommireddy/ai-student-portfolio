import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Terminal, Cpu, Award, Mail, ExternalLink, ArrowUpRight, Search, 
  BookOpen, BrainCircuit, Code2, Database, Wrench, Download, FileText, 
  MessageSquare, User, Send, CheckCircle, DatabaseZap, Github, Star, Calendar, Bookmark, AppWindow
} from "lucide-react";
import { Project, Certificate, ProjectCategory, ProfileSettings } from "../types";
import { apiService } from "../services/api";
import ProjectCard from "../components/ProjectCard";

interface PortfolioProps {
  onAddToast: (text: string, type: "success" | "error" | "info") => void;
  projects: Project[];
  certificates: Certificate[];
  settings: ProfileSettings | null;
  onRefreshData: () => void;
  isLoading: boolean;
  dbStatus: "mongodb" | "local";
}

export default function Portfolio({
  onAddToast,
  projects,
  certificates,
  settings,
  onRefreshData,
  isLoading,
  dbStatus
}: PortfolioProps) {
  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time Github repositories
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  // Custom Typing Effect in Hero
  const [typewriterText, setTypewriterText] = useState("");
  const typingWords = settings?.role 
    ? [settings.role, "AI & Machine Learning Student", "Python & Java Enthusiast"]
    : ["AI & Machine Learning Student", "Full Stack Developer", "Data Scientist", "Python & Java Enthusiast"];
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resume Modal
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  // PWA Installation Hook
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real GitHub repositories dynamically on mount
  useEffect(() => {
    const loadGithubRepos = async () => {
      setIsGithubLoading(true);
      try {
        const username = settings?.codingProfiles?.githubUsername || "kommireddycharan1";
        const repos = await apiService.getGithubRepos(username);
        setGithubRepos(repos);
      } catch (err) {
        console.warn("Could not query GitHub repo proxy:", err);
      } finally {
        setIsGithubLoading(false);
      }
    };
    loadGithubRepos();
  }, [settings?.codingProfiles?.githubUsername]);

  // Typewriter Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentWord = typingWords[wordIdx] || "AI & Machine Learning Student";
    const speed = isDeleting ? 30 : 80;

    if (!isDeleting && charIdx === currentWord.length) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIdx === 0) {
      setIsDeleting(false);
      setWordIdx((prev) => (prev + 1) % typingWords.length);
    } else {
      timer = setTimeout(() => {
        setTypewriterText(
          isDeleting 
            ? currentWord.substring(0, charIdx - 1) 
            : currentWord.substring(0, charIdx + 1)
        );
        setCharIdx((prev) => (isDeleting ? prev - 1 : prev + 1));
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, wordIdx, settings?.role]);

  // Listening for PWA Install prompt
  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      onAddToast("Thank you for installing our Portfolio companion app!", "success");
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // Handle Contact Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, subject, message } = contactForm;

    if (!name || !email || !subject || !message) {
      onAddToast("Please fill in all form fields.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      onAddToast("Please provide a valid email address.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.sendContactMessage(name, email, subject, message);
      onAddToast("Thank you! Your message was sent and saved.", "success");
      setContactForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      onAddToast(err.message || "Failed to submit contact message.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    const matchesCategory = selectedCategory === "All" || project.category === selectedCategory;
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.technologies.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Default dynamic Skills Categories
  const defaultSkillCategories = [
    {
      category: "Programming & Foundations",
      list: ["Python", "Java", "C / C++", "JavaScript / TS"]
    },
    {
      category: "Artificial Intelligence",
      list: ["Machine Learning (Scikit-Learn)", "Deep Learning (PyTorch)", "NumPy & Pandas", "Computer Vision & NLP"]
    },
    {
      category: "Intelligent Web Development",
      list: ["React / Next.js", "Node.js & Express", "HTML5 & CSS3", "Tailwind CSS"]
    },
    {
      category: "Database & Toolchains",
      list: ["MongoDB & Mongoose", "PostgreSQL & SQL", "Git & GitHub", "Docker & Linux"]
    }
  ];

  const skillCategories = (settings?.skills && settings.skills.length > 0)
    ? settings.skills
    : defaultSkillCategories;

  const getSkillIcon = (catName: string) => {
    const name = catName.toLowerCase();
    if (name.includes("prog") || name.includes("code") || name.includes("lang")) {
      return <Code2 className="w-5 h-5 text-violet-500" />;
    }
    if (name.includes("ai") || name.includes("machine") || name.includes("learn") || name.includes("deep") || name.includes("intell")) {
      return <BrainCircuit className="w-5 h-5 text-fuchsia-500" />;
    }
    if (name.includes("web") || name.includes("dev") || name.includes("frontend")) {
      return <Terminal className="w-5 h-5 text-indigo-500" />;
    }
    return <Database className="w-5 h-5 text-sky-500" />;
  };

  // Helper to trigger ATS resume text generator as fallback
  const handleDownloadResume = () => {
    // If we have a custom resume pdf/file in settings, download it if it's base64 or link
    if (settings?.resumePdf && settings.resumePdf.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = settings.resumePdf;
      link.download = "Charan_Kommireddy_Resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onAddToast("Dynamic resume downloaded successfully!", "success");
      return;
    }

    const resumeText = `
CHARAN KOMMIREDDY
Computer Science & Artificial Intelligence Student
Email: ${settings?.socialLinks?.email || "kommireddycharan1@gmail.com"}
LinkedIn: ${settings?.socialLinks?.linkedin || "linkedin.com/in/charankommireddy"}
GitHub: ${settings?.socialLinks?.github || "github.com/charankommireddy"}

OBJECTIVE
Passionate Computer Science student specializing in Artificial Intelligence. Seeking to leverage strong programming skills in Python, Java, and JavaScript alongside Machine Learning foundations to develop state-of-the-art software and predictive models.

EDUCATION
${(settings?.resumeDetails?.education || [
  { institution: "Deepmind Institute of Technology", degree: "Bachelor of Technology in CS (AI)", period: "2023 - 2027", details: "GPA: 3.92/4.0" },
  { institution: "Science Academy", degree: "Higher Secondary Certificate in Computer Science", period: "2021 - 2023", details: "Grade: 95.8%" }
]).map(e => `- ${e.degree}\n  ${e.institution} | ${e.period} (${e.details || ""})`).join("\n")}

TECHNICAL SKILLS
- Programming: Python, Java, C, C++, JavaScript, TypeScript
- AI/ML: Machine Learning, NumPy, Pandas, Scikit-learn, PyTorch, Deep Learning, NLP
- Web Development: HTML5, CSS3, React, Node.js, Express.js, RESTful APIs
- Databases: MongoDB, MySQL, PostgreSQL
- Tools: Git, GitHub, VS Code, Postman, Linux

SELECTED PROJECTS
1. AI-Powered Coding Assistant
   - Developed an intelligent coding copilot using LLMs that completes and refactors code.
   - Built with React, Express, TypeScript, and Gemini API.
2. Real-time Multi-agent Orchestration Suite
   - Crafted a fully visual canvas to coordinate multi-agent system workflows.
   - Built with React, D3.js, Node.js, and MongoDB.

CERTIFICATIONS
- Machine Learning Specialization (DeepLearning.AI)
- TensorFlow Developer Certificate (Google)
`;
    
    const blob = new Blob([resumeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Charan_Kommireddy_Resume.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onAddToast("ATS text-optimized resume downloaded!", "success");
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 min-h-screen pt-16 transition-colors duration-300">
      
      {/* 1. HERO SECTION */}
      <section id="home" className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 overflow-hidden border-b border-zinc-200/40 dark:border-zinc-900/40">
        
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/10 dark:bg-fuchsia-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
          
          {/* Left Column: Greeting and Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            
            {isInstallable && (
              <motion.button 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/10 dark:bg-violet-400/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-mono text-[11px] font-semibold tracking-wider hover:bg-violet-600 hover:text-white transition-all cursor-pointer"
              >
                <AppWindow className="w-3.5 h-3.5" />
                <span>INSTALL DESKTOP PORTFOLIO APP</span>
              </motion.button>
            )}

            <div className="space-y-2">
              <span className="font-mono text-sm font-semibold tracking-wider text-violet-600 dark:text-violet-400 bg-violet-600/10 dark:bg-violet-500/10 px-3.5 py-1.5 rounded-full">
                👋 Welcome to my AI Space
              </span>
              <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] pt-3">
                Hi, I'm <span className="gradient-text">{settings?.fullName || "Charan Kommireddy"}</span>
              </h1>
            </div>

            {/* Simulated Animated Typing cursor */}
            <div className="h-10 flex items-center justify-center lg:justify-start">
              <p className="font-mono text-sm sm:text-lg font-medium text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-700 dark:text-zinc-200 border-r-2 border-violet-500 animate-pulse pr-1">
                  {typewriterText}
                </span>
              </p>
            </div>

            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
              {settings?.aboutText || "B.Tech Computer Science honors student specializing in Machine Learning, Deep Learning networks, and dynamic web application orchestration. Designing secure, backend-connected intelligent systems."}
            </p>

            {/* Quick Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-200/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
              <span
  className={`w-2 h-2 rounded-full ${
    dbStatus === "mongodb"
      ? "bg-green-500 animate-ping"
      : "bg-yellow-500"
  }`}
/>

<span>
  Database Synchronization Status:{" "}
  <strong className="uppercase">
    {dbStatus === "mongodb" ? "MONGODB ONLINE" : "LOCAL CACHE"}
  </strong>
</span>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <a 
                href="#projects" 
                className="px-6 py-3 text-xs font-bold font-mono rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 transition-all hover:-translate-y-0.5"
              >
                View Selected Projects
              </a>
              <button 
                onClick={() => setIsResumeOpen(true)}
                className="px-6 py-3 text-xs font-bold font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all hover:-translate-y-0.5"
              >
                Interactive Resume
              </button>
              <a 
                href="#contact" 
                className="px-6 py-3 text-xs font-bold font-mono rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all hover:-translate-y-0.5"
              >
                Contact Me
              </a>
            </div>

          </div>

          {/* Right Column: Dynamic Portrait Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-72 h-72 sm:w-96 sm:h-96">
              
              {/* Outer floating blur backdrops */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-600 opacity-30 blur-2xl animate-pulse-slow" />
              
              {/* Glass frame container */}
              <div className="relative w-full h-full rounded-3xl glass-card overflow-hidden p-3 flex items-center justify-center border-white/30 dark:border-zinc-800/40">
                <img 
                  src={settings?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80"}
                  alt={settings?.fullName || "Charan Kommireddy"}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-2xl shadow-inner select-none transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Floaters stats badge */}
              <div className="absolute -bottom-4 -left-4 glass-card p-4 rounded-2xl flex items-center gap-3 border-fuchsia-500/20 shadow-xl max-w-[180px]">
                <div className="p-2 bg-fuchsia-600/15 rounded-xl text-fuchsia-600 dark:text-fuchsia-400">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white leading-none">AI Student</h4>
                  <p className="text-[9px] font-mono text-zinc-400 mt-1 uppercase">Academic Focus</p>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 glass-card p-4 rounded-2xl flex items-center gap-3 border-fuchsia-500/20 shadow-xl max-w-[180px]">
                <div className="p-2 bg-fuchsia-600/15 rounded-xl text-fuchsia-600 dark:text-fuchsia-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white leading-none">AI/ML</h4>
                  <p className="text-[9px] font-mono text-zinc-400 mt-1 uppercase">Specialization</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. ABOUT & STATS SECTION */}
      <section id="about" className="py-24 px-4 bg-zinc-100/30 dark:bg-zinc-950/20 border-b border-zinc-200/40 dark:border-zinc-900/40">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* About text narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-sm uppercase tracking-wider font-semibold">
                <User className="w-4 h-4" />
                <span>01. Academic Profile</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight">
                Engineering Smarter Neural Ecosystems
              </h2>
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                {settings?.aboutText || "As an honors student, I study the intersection of database architecture, full-stack reactive design, and localized machine learning inference. I aim to replace heavy server-side telemetry configurations with elegant, cache-authorized client interfaces."}
              </p>

              {/* Profile Highlights list */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Key Research Focus & Competencies</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <li className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>Neural Network Topologies</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>Multi-Agent Collaborations</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>Predictive Statistical Modeling</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>Secure Backend Architecture</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick stats box counts */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-6">
              
              <div className="glass-card p-6 sm:p-8 rounded-3xl text-center border-zinc-200/50 dark:border-zinc-800/40 relative group overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-violet-600/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <h3 className="font-display font-black text-4xl sm:text-5xl text-violet-600 dark:text-violet-400">{projects.length}</h3>
                <p className="text-xs font-mono uppercase text-zinc-400 tracking-wider mt-2 font-semibold">Active Projects</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[160px] mx-auto leading-normal">Fully synchronized database records</p>
              </div>

              <div className="glass-card p-6 sm:p-8 rounded-3xl text-center border-zinc-200/50 dark:border-zinc-800/40 relative group overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-fuchsia-600/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <h3 className="font-display font-black text-4xl sm:text-5xl text-fuchsia-600 dark:text-fuchsia-400">{certificates.length}</h3>
                <p className="text-xs font-mono uppercase text-zinc-400 tracking-wider mt-2 font-semibold">Certifications</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[160px] mx-auto leading-normal">Verified industry achievements</p>
              </div>

              <div className="glass-card p-6 sm:p-8 rounded-3xl text-center col-span-2 border-zinc-200/50 dark:border-zinc-800/40 relative group overflow-hidden flex items-center justify-between">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-600/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="text-left space-y-1 relative z-10">
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">GitHub Coordinates</h4>
                  <p className="text-sm font-display font-bold text-zinc-900 dark:text-white">@{settings?.codingProfiles?.githubUsername || "kommireddycharan1"}</p>
                </div>
                <div className="relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                  <Github className="w-4 h-4" />
                  <span>Public Developer Mode</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. DEDICATED EDUCATION SECTION */}
      <section id="education" className="py-24 px-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/40 dark:border-zinc-900/40">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-sm uppercase tracking-wider font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>02. Academic Background</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight">
              Degree & Academic Journey
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Highly organized, honors computer science and artificial intelligence curriculum coursework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {(settings?.resumeDetails?.education || [
              { institution: "Deepmind Institute of Technology", degree: "B.Tech. in Computer Science (Artificial Intelligence)", period: "2023 - 2027", details: "GPA: 3.92 / 4.00" }
            ]).map((edu, idx) => (
              <div 
                key={idx} 
                className="glass-card rounded-3xl p-6 sm:p-8 border border-zinc-200/50 dark:border-zinc-800/40 relative overflow-hidden flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-3 bg-violet-600/10 dark:bg-violet-400/10 rounded-2xl text-violet-600 dark:text-violet-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                      {edu.period}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-md sm:text-lg text-zinc-900 dark:text-white leading-snug">
                      {edu.degree}
                    </h3>
                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 font-mono">
                      {edu.institution}
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {edu.details && (
                      <div className="p-3 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-800/30 text-xs font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                        <span>Grade/Academic Standing:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{edu.details}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block font-semibold">Relevant Coursework</span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                        {edu.coursework || "Advanced Data Structures & Algorithms, Deep Neural Networks, Multi-Agent System Coherence, Reinforcement Learning Frameworks, Python & TypeScript Full Stack Systems."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. SKILLS SECTION */}
      <section id="skills" className="py-24 px-4 max-w-7xl mx-auto border-b border-zinc-200/40 dark:border-zinc-900/40">
        <div className="space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-sm uppercase tracking-wider font-semibold">
              <Wrench className="w-4 h-4" />
              <span>02. Technical Skillsets</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight">
              Categorized Machine Learning & Dev Tools
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              These skill cards represent my dynamic curriculum focus areas. All elements are updated instantly from the Admin settings profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skillCategories.map((cat, idx) => (
              <div 
                key={idx} 
                className="glass-card rounded-2xl p-6 border-zinc-200/50 dark:border-zinc-800/40 relative group overflow-hidden transition-all duration-300 hover:border-violet-500/30"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  {getSkillIcon(cat.category)}
                </div>
                
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl text-zinc-600 dark:text-zinc-400">
                    {getSkillIcon(cat.category)}
                  </div>
                  <h3 className="font-display font-bold text-xs sm:text-sm text-zinc-900 dark:text-white tracking-tight uppercase">
                    {cat.category}
                  </h3>
                </div>

                <ul className="space-y-2.5">
                  {cat.list.map((skillName, sIdx) => (
                    <li key={sIdx} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono font-medium">{skillName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. PROJECTS SECTION */}
      <section id="projects" className="py-24 px-4 max-w-7xl mx-auto border-b border-zinc-200/40 dark:border-zinc-900/40">
        <div className="space-y-12">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-sm uppercase tracking-wider font-semibold">
                <Code2 className="w-4 h-4" />
                <span>03. Selected Projects</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight">
                Meticulous AI & Software Builds
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                Filter or search through actual working code projects synced in real-time from our database.
              </p>
            </div>

            {/* Search Input bar */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search projects or tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-xs font-semibold focus:outline-none focus:border-violet-500 transition-all text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filtering Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(["All", "AI/ML", "Full Stack", "Data Science", "Mobile"] as ProjectCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold font-mono rounded-xl border transition-all ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/10 cursor-pointer"
                    : "bg-white/50 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Projects Grid Display */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card rounded-2xl p-6 h-96 animate-pulse space-y-4">
                  <div className="w-full h-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                  <div className="h-6 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="glass-card text-center py-16 px-4 rounded-2xl max-w-md mx-auto space-y-3">
              <p className="font-display font-semibold text-lg text-zinc-800 dark:text-zinc-200">No matching projects found</p>
              <p className="text-xs text-zinc-400">Try modifying your search criteria or filter options.</p>
            </div>
          )}

        </div>
      </section>

      {/* 5. GITHUB & CODING PROFILES LIVE REPOSITORIES */}
      <section id="coding-profiles" className="py-24 px-4 bg-zinc-100/30 dark:bg-zinc-950/20 border-b border-zinc-200/40 dark:border-zinc-900/40">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-sm uppercase tracking-wider font-semibold">
              <Github className="w-4 h-4" />
              <span>04. Coding & Platform Profiles</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight">
              Platform Links & Live GitHub Repos
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Real-time synchronization with GitHub user API to present verified public project logs.
            </p>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* GitHub Profile */}
            <a 
              href={settings?.socialLinks?.github || "https://github.com/kommireddycharan1"}
              target="_blank"
              rel="noreferrer"
              className="glass-card p-6 rounded-2xl flex items-center justify-between border-zinc-200/60 dark:border-zinc-800/60 hover:border-violet-500/30 transition-all hover:scale-102 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-900 text-white rounded-xl">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">GitHub</h4>
                  <p className="font-mono text-[10px] text-zinc-400 mt-0.5">@{settings?.codingProfiles?.githubUsername || "kommireddycharan1"}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 text-zinc-400 group-hover:text-violet-500 transition-colors" />
            </a>

            {/* LeetCode */}
            <a 
              href={settings?.codingProfiles?.leetcodeUsername ? `https://leetcode.com/u/${settings.codingProfiles.leetcodeUsername}/` : "https://leetcode.com/kommireddycharan1/"}
              target="_blank"
              rel="noreferrer"
              className="glass-card p-6 rounded-2xl flex items-center justify-between border-zinc-200/60 dark:border-zinc-800/60 hover:border-orange-500/30 transition-all hover:scale-102 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">LeetCode</h4>
                  <p className="font-mono text-[10px] text-zinc-400 mt-0.5">@{settings?.codingProfiles?.leetcodeUsername || "kommireddycharan1"}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
            </a>

            {/* HackerRank */}
            <a 
              href={settings?.codingProfiles?.hackerrankUsername ? `https://hackerrank.com/profile/${settings.codingProfiles.hackerrankUsername}` : "https://hackerrank.com/profile/kommireddycharan1"}
              target="_blank"
              rel="noreferrer"
              className="glass-card p-6 rounded-2xl flex items-center justify-between border-zinc-200/60 dark:border-zinc-800/60 hover:border-green-500/30 transition-all hover:scale-102 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">HackerRank</h4>
                  <p className="font-mono text-[10px] text-zinc-400 mt-0.5">@{settings?.codingProfiles?.hackerrankUsername || "kommireddycharan1"}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 text-zinc-400 group-hover:text-green-500 transition-colors" />
            </a>

          </div>

          {/* GitHub Repositories dynamic display */}
          <div className="space-y-6 max-w-5xl mx-auto pt-4">
            <h3 className="font-display font-bold text-md text-zinc-900 dark:text-white flex items-center gap-2">
              <Github className="w-5 h-5 text-violet-500" />
              <span>Public Repositories Proxy Logs</span>
            </h3>

            {isGithubLoading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                <span className="font-mono text-xs text-zinc-500">Querying GitHub API proxies...</span>
              </div>
            ) : githubRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {githubRepos.slice(0, 6).map((repo, idx) => (
                  <div key={idx} className="glass-card rounded-2xl p-5 border-zinc-200/40 dark:border-zinc-800/40 flex flex-col justify-between h-full hover:border-violet-500/20 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Bookmark className="w-4 h-4 text-violet-500" />
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 font-semibold text-zinc-500 dark:text-zinc-400">{repo.language}</span>
                      </div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-zinc-900 dark:text-white mt-1 break-words">
                        {repo.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans line-clamp-3">
                        {repo.description || "No public summary provided for this codebase."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-200/30 dark:border-zinc-800/30">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 font-semibold">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{repo.stargazers_count}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                        </span>
                      </div>
                      <a 
                        href={repo.html_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-violet-600 hover:bg-violet-500/10 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-zinc-400 py-10">No repositories available.</p>
            )}
          </div>

        </div>
      </section>

      {/* 6. CERTIFICATIONS SECTION */}
      <section id="certifications" className="py-24 px-4 bg-zinc-100/30 dark:bg-zinc-950/20 border-b border-zinc-200/40 dark:border-zinc-900/40">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-sm uppercase tracking-wider font-semibold">
              <Award className="w-4 h-4" />
              <span>05. Professional Certifications</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight">
              Verified Skills & Achievements
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Industry credentials obtained from tier-1 corporations and educational platforms.
            </p>
          </div>

          {/* Certifications Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card rounded-2xl p-6 h-48 animate-pulse space-y-3">
                  <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-5 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div key={cert.id} className="glass-card rounded-2xl p-6 hover:border-violet-500/20 transition-all flex flex-col h-full hover:-translate-y-0.5 duration-300">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-3 bg-violet-600/10 dark:bg-violet-400/10 rounded-xl text-violet-600 dark:text-violet-400">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      {cert.date}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-md text-zinc-900 dark:text-white flex-grow">
                    {cert.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                    {cert.issuingOrganization}
                  </p>

                  {cert.credentialLink && (
                    <a
                      href={cert.credentialLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mt-5 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50"
                    >
                      <span>Verify Credential</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-400 py-10 text-xs">No certifications registered.</div>
          )}

        </div>
      </section>

      {/* 7. CONTACT SECTION */}
      <section id="contact" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Block: Contact coordinates */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-mono text-sm uppercase tracking-wider font-semibold">
              <Mail className="w-4 h-4" />
              <span>06. Get In Touch</span>
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white leading-tight">
              Let's Discuss Your Next Innovation
            </h2>

            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              If you have a predictive models requirement, full-stack opportunity, or simply want to say hello, feel free to fill in the contact form or send an email directly.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl text-zinc-600 dark:text-zinc-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Direct Email</p>
                  <a href={`mailto:${settings?.socialLinks?.email || "kommireddycharan1@gmail.com"}`} className="text-sm font-semibold hover:text-violet-600 dark:hover:text-violet-400 break-all">
                    {settings?.socialLinks?.email || "kommireddycharan1@gmail.com"}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Message Form */}
          <div className="lg:col-span-7">
            <div className="glass-card rounded-3xl p-6 sm:p-8">
              <form onSubmit={handleContactSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold font-mono text-zinc-500 dark:text-zinc-400" htmlFor="contact-name">Full Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Alan Turing"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 focus:outline-none focus:border-violet-500 transition-all font-sans font-medium text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold font-mono text-zinc-500 dark:text-zinc-400" htmlFor="contact-email">Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="alan@turing.org"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 focus:outline-none focus:border-violet-500 transition-all font-sans font-medium text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500 dark:text-zinc-400" htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    type="text"
                    placeholder="Machine Learning Collaboration"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 focus:outline-none focus:border-violet-500 transition-all font-sans font-medium text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-mono text-zinc-500 dark:text-zinc-400" htmlFor="contact-message">Message Details</label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Describe your project, timeline, or query..."
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/30 focus:outline-none focus:border-violet-500 transition-all font-sans font-medium leading-relaxed text-zinc-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 w-full py-3 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* 8. INTERACTIVE RESUME VIEWER MODAL */}
      {isResumeOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative border border-white/25">
            
            {/* Header control drawer */}
            <div className="sticky top-0 right-0 left-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                <h3 className="font-display font-bold text-md text-zinc-900 dark:text-white">ATS Curriculum Vitae</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadResume}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{settings?.resumePdf ? "Download PDF" : "Download ATS Resume"}</span>
                </button>
                <button
                  onClick={() => setIsResumeOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Resume Content Body */}
            <div className="p-6 sm:p-8 space-y-6 text-zinc-700 dark:text-zinc-300 select-text leading-relaxed text-sm">
              
              {/* Profile Bio */}
              <div className="text-center border-b border-zinc-200/50 dark:border-zinc-800/50 pb-6">
                <h4 className="font-display font-extrabold text-2xl text-zinc-900 dark:text-white">{settings?.fullName || "CHARAN KOMMIREDDY"}</h4>
                <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-wider">{settings?.role || "B.Tech. in Computer Science (Artificial Intelligence)"}</p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-400 mt-3">
                  <span>{settings?.socialLinks?.email || "kommireddycharan1@gmail.com"}</span>
                  <span>&bull;</span>
                  <span>{settings?.socialLinks?.linkedin || "linkedin.com/in/charankommireddy"}</span>
                  <span>&bull;</span>
                  <span>{settings?.socialLinks?.github || "github.com/kommireddycharan1"}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <h5 className="font-display font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">Professional Summary</h5>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {settings?.aboutText || "Passionate Computer Science student specializing in Artificial Intelligence. Seeking to leverage strong programming skills in Python, Java, and JavaScript alongside Machine Learning foundations to develop state-of-the-art software."}
                </p>
              </div>

              {/* Education */}
              <div className="space-y-3">
                <h5 className="font-display font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">Education</h5>
                <div className="space-y-3">
                  {(settings?.resumeDetails?.education || [
                    { institution: "Deepmind Institute of Technology", degree: "B.Tech. in Computer Science (Artificial Intelligence)", period: "2023 - 2027", details: "GPA: 3.92 / 4.00" },
                    { institution: "Science Academy", degree: "Higher Secondary Certificate (CS Majors)", period: "2021 - 2023", details: "Grade: 95.8%" }
                  ]).map((edu, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-bold text-zinc-900 dark:text-white">
                        <span>{edu.degree}</span>
                        <span className="font-mono text-zinc-500 font-medium">{edu.period}</span>
                      </div>
                      <div className="text-xs text-zinc-400">{edu.institution} {edu.details && `• ${edu.details}`}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <h5 className="font-display font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">Work & Project Experience</h5>
                <div className="space-y-3">
                  {(settings?.resumeDetails?.experience || [
                    { company: "AI & Machine Learning Research Labs", role: "Undergraduate Researcher", period: "2024 - Present", details: "Investigated neural network architectures and multi-agent system simulation workflows." }
                  ]).map((exp, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-bold text-zinc-900 dark:text-white">
                        <span>{exp.role}</span>
                        <span className="font-mono text-zinc-500 font-medium">{exp.period}</span>
                      </div>
                      <div className="text-xs text-zinc-400">{exp.company}</div>
                      {exp.details && <p className="text-xs text-zinc-500 mt-1">{exp.details}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills summary block */}
              <div className="space-y-2">
                <h5 className="font-display font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">Technical Expertise</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {skillCategories.map((cat, idx) => (
                    <p key={idx}><strong>{cat.category}:</strong> {cat.list.join(", ")}</p>
                  ))}
                </div>
              </div>

              {/* Saved custom resume upload prompt or preview */}
              {settings?.resumePdf && (
                <div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center gap-3">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase">Interactive PDF Asset Linked</p>
                  <iframe 
                    src={settings.resumePdf} 
                    className="w-full h-80 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40"
                    title="Resume PDF"
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Portfolio from "./pages/Portfolio";
import AdminDashboard from "./pages/AdminDashboard";
import Toast, { ToastMessage } from "./components/Toast";
import { apiService } from "./services/api";
import { Project, Certificate, ProfileSettings } from "./types";

export default function App() {
  // Navigation: state-based to ensure absolute compatibility inside iframes
  const [view, setView] = useState<"portfolio" | "admin">("portfolio");
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("portfolio_theme");
    if (saved) return saved === "dark";
    // Default to dark theme for premium tech feel
    return true;
  });

  // Database lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<"mongodb" | "local">("local");

  // Authentication
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Toast notifications list
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add a new toast notification
  const handleAddToast = (text: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync theme with HTML DOM class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("portfolio_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("portfolio_theme", "light");
    }
  }, [isDarkMode]);

  // Check auth and fetch DB state on mount
  useEffect(() => {
    const token = localStorage.getItem("portfolio_admin_token");
    if (token) {
      setIsAdminLoggedIn(true);
    }
    fetchDbData();
  }, []);

  // Fetch dynamic records from server
  const fetchDbData = async () => {
    setIsLoading(true);
    try {
      // 1. Get database type
      const statusRes = await apiService.getDbStatus().catch(() => ({ status: "local" as const }));
      setDbStatus(statusRes.status);

      // 2. Load projects
      const projs = await apiService.getProjects();
      setProjects(projs);

      // 3. Load certifications
      const certs = await apiService.getCertificates();
      setCertificates(certs);

      // 4. Load dynamic settings/profile details
      const settingsData = await apiService.getSettings();
      setSettings(settingsData);
    } catch (err) {
      console.error("Failed to hydrate portfolio records:", err);
      handleAddToast("Database connection offline. Showing fallback sandbox mock records.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAdminLoggedIn(false);
    setView("portfolio");
    handleAddToast("Logged out successfully.", "info");
    fetchDbData();
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 flex flex-col justify-between">
      
      {/* Floating Header Navbar */}
      <Navbar
        currentView={view}
        onViewChange={(newView) => {
          setView(newView);
          // Check if admin is still authenticated when switching to admin view
          if (newView === "admin") {
            const token = localStorage.getItem("portfolio_admin_token");
            setIsAdminLoggedIn(!!token);
          }
        }}
        isDark={isDarkMode}
        onToggleTheme={handleToggleTheme}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Pages Content container */}
      <main className="flex-grow">
        {view === "portfolio" ? (
          <Portfolio
            onAddToast={handleAddToast}
            projects={projects}
            certificates={certificates}
            settings={settings}
            onRefreshData={fetchDbData}
            isLoading={isLoading}
            dbStatus={dbStatus}
          />
        ) : (
          <AdminDashboard
            onAddToast={handleAddToast}
            projects={projects}
            certificates={certificates}
            settings={settings}
            onRefreshData={fetchDbData}
            dbStatus={dbStatus}
          />
        )}
      </main>

      {/* Client-facing footer */}
      {view === "portfolio" && <Footer />}

      {/* Toasts floating notifications layer */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={handleCloseToast} />
        ))}
      </div>

    </div>
  );
}

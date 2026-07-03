import { useState, useEffect } from "react";
import { Sun, Moon, Menu, X, LogIn, LogOut, Code } from "lucide-react";

interface NavbarProps {
  currentView: "portfolio" | "admin";
  onViewChange: (view: "portfolio" | "admin") => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onViewChange,
  isDark,
  onToggleTheme,
  isAdminLoggedIn,
  onLogout
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Certifications", href: "#certifications" },
    { label: "Contact", href: "#contact" }
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    onViewChange("portfolio");
    // Wait slightly for layout to switch before scrolling
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <nav
      id="app-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-nav py-3 shadow-md"
          : "bg-transparent py-5 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div 
            onClick={() => handleNavClick("#home")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-violet-600/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400 transition-transform group-hover:scale-105">
              <Code className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
              AI<span className="text-violet-500">Portfolio</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {currentView === "portfolio" && (
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Separator line */}
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Icons / Controls */}
            <div className="flex items-center gap-3">
              {/* Dark/Light mode toggle */}
              <button
                onClick={onToggleTheme}
                className="p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-all"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* Admin Button */}
              {currentView === "portfolio" ? (
                <button
                  onClick={() => onViewChange("admin")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-all"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  <span>{isAdminLoggedIn ? "Admin Panel" : "Login"}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewChange("portfolio")}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                  >
                    Back to Site
                  </button>
                  {isAdminLoggedIn && (
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburguer Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            {/* Theme Toggle on mobile outside drawer for convenience */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-all"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-all"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden glass-nav absolute top-full left-0 right-0 border-t border-zinc-200/50 dark:border-zinc-800/50 py-4 px-4 flex flex-col gap-3 shadow-xl">
          {currentView === "portfolio" && (
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="px-4 py-2.5 rounded-xl text-left text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 hover:text-violet-600 dark:hover:text-violet-400 transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

          <div className="px-2">
            {currentView === "portfolio" ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onViewChange("admin");
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md transition-all"
              >
                <LogIn className="w-4.5 h-4.5" />
                <span>{isAdminLoggedIn ? "Admin Dashboard" : "Admin Login"}</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onViewChange("portfolio");
                  }}
                  className="flex items-center justify-center py-2.5 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                >
                  Back to Site
                </button>
                {isAdminLoggedIn && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

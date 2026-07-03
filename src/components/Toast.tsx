import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

interface ToastProps {
  key?: React.Key;
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />
  };

  const borders = {
    success: "border-emerald-500/15 bg-emerald-500/5 dark:bg-emerald-500/10",
    error: "border-rose-500/15 bg-rose-500/5 dark:bg-rose-500/10",
    info: "border-sky-500/15 bg-sky-500/5 dark:bg-sky-500/10"
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border glass-card shadow-lg ${borders[toast.type]} max-w-sm w-full pointer-events-auto transition-all duration-300 transform animate-float`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-grow text-xs font-medium text-zinc-800 dark:text-zinc-200">
        {toast.text}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
      >
        <X className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}

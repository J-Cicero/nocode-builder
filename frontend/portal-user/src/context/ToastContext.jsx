import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "error") => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const alert = useCallback((message) => {
    addToast(message, "error");
  }, [addToast]);

  const success = useCallback((message) => {
    addToast(message, "success");
  }, [addToast]);

  const info = useCallback((message) => {
    addToast(message, "info");
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ alert, success, info, addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const colors = {
            error: "bg-red-50 text-red-800 border-red-200",
            success: "bg-green-50 text-green-800 border-green-200",
            info: "bg-blue-50 text-blue-800 border-blue-200"
          };
          
          const icons = {
            error: <XCircle size={20} className="text-red-500" />,
            success: <CheckCircle size={20} className="text-green-500" />,
            info: <Info size={20} className="text-blue-500" />
          };

          return (
            <div 
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto transform transition-all animate-in slide-in-from-right-8 fade-in duration-300 w-80 ${colors[toast.type]}`}
            >
              <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
              <div className="flex-1 text-sm font-medium leading-tight">
                {toast.message}
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

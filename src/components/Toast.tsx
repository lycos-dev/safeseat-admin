import { CheckCircle2, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ToastItem { id: number; message: string; }
interface ToastContextValue { push: (message: string) => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string) => {
    const id = Date.now();
    setItems(prev => [...prev, { id, message }]);
    window.setTimeout(() => setItems(prev => prev.filter(item => item.id !== id)), 2800);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map(item => (
          <div className="toast" key={item.id}>
            <CheckCircle2 size={18} />
            <span>{item.message}</span>
            <button onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))} aria-label="Dismiss"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

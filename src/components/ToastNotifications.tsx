import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Info, X, Zap } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ToastNotificationsProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastNotifications({ toasts, onRemove }: ToastNotificationsProps) {
  return (
    <div className="fixed bottom-16 right-4 z-[110] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = 'bg-[#0a0f1d] border-cyan-500/30 text-slate-100';
          let Icon = Info;
          let iconColor = 'text-cyan-400';
          let progressBg = 'bg-cyan-500';

          if (toast.type === 'success') {
            bgColor = 'bg-[#081512] border-emerald-500/30 text-slate-100';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
            progressBg = 'bg-emerald-500';
          } else if (toast.type === 'warning') {
            bgColor = 'bg-[#151009] border-amber-500/30 text-slate-100';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
            progressBg = 'bg-amber-500';
          } else if (toast.type === 'error') {
            bgColor = 'bg-[#190a0f] border-red-500/30 text-slate-100';
            Icon = ShieldAlert;
            iconColor = 'text-red-500';
            progressBg = 'bg-red-500';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto relative p-4 rounded-xl border shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex gap-3 overflow-hidden ${bgColor}`}
            >
              {/* Type Accent Icon */}
              <div className="shrink-0 mt-0.5">
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-sans text-xs font-bold leading-normal tracking-tight text-white flex items-center gap-1.5">
                  {toast.title}
                  {toast.type === 'error' && (
                    <span className="animate-ping w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  )}
                </h4>
                <p className="font-sans text-[10.5px] text-slate-400 leading-normal mt-1 font-light">
                  {toast.message}
                </p>
              </div>

              {/* Close Action */}
              <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-slate-900/40 border border-transparent hover:border-slate-800 cursor-pointer self-start"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Animated Progress Timer Bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[2px] ${progressBg}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

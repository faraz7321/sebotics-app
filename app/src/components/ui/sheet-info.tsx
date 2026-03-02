import * as React from "react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  label: string;
  value: string;
  active?: boolean;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning" | "info";
}

export function StatusCard({ label, value, active, icon, variant = "default" }: StatusCardProps) {
  return (
    <div className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={cn(
        "text-xs font-bold",
        variant === "success" && "text-green-600",
        variant === "error" && "text-red-600",
        variant === "warning" && "text-amber-600",
        variant === "info" && "text-blue-600",
        variant === "default" && active && "text-blue-600",
        variant === "default" && !active && "text-slate-700"
      )}>
        {value}
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string | number;
  isMono?: boolean;
}

export function DetailRow({ label, value, isMono }: DetailRowProps) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className={cn(
        "font-bold text-slate-700",
        isMono && "font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-50"
      )}>
        {value}
      </span>
    </div>
  );
}

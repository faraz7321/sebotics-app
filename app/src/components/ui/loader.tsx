import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  message?: string;
  className?: string;
  variant?: "fullscreen" | "container";
}

export function Loader({
  message,
  className,
  variant = "fullscreen",
}: LoaderProps) {

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300",
        variant === "fullscreen" ? "fixed inset-0 z-[100]" : "absolute inset-0 z-10",
        className
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {message && (
          <p className="text-sm font-medium animate-pulse text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
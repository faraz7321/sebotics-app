import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types/TaskTypes";
import { ClipboardList, Calendar, Bot, Activity, CheckCircle2, XCircle, Play, Pause } from "lucide-react";
import { ActType, ActTypeLabel } from "@/lib/types/TaskTypes";
import { StatusCard, DetailRow } from "@/components/ui/sheet-info";

type ViewTaskProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onExecuteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
};

export default function ViewTaskSheet({ open, onOpenChange, task, onExecuteTask, onCancelTask }: ViewTaskProps) {
  if (!task) return null;

  const date = task.createTime ? new Date(Number(task.createTime)) : null;
  const formattedDate = date && !isNaN(date.getTime()) ? date.toLocaleString() : "---";

  const getStatusInfo = (actType?: ActType) => {
    if (!actType) return { label: "Unknown", variant: "default" as const, icon: <Activity className="h-3 w-3" /> };

    if (actType === ActType.TaskFinished || actType === ActType.ArrivedAtDestination) {
      return { label: "Finished", variant: "success" as const, icon: <CheckCircle2 className="h-3 w-3" /> };
    }
    if (actType === ActType.TaskPaused) {
      return { label: "Paused", variant: "warning" as const, icon: <Pause className="h-3 w-3" /> };
    }
    if (actType === ActType.GoToDestination || actType === ActType.TaskStarted) {
      return { label: "Executing", variant: "info" as const, icon: <Play className="h-3 w-3" /> };
    }
    return { label: ActTypeLabel[actType as ActType] || "Active", variant: "default" as const, icon: <Activity className="h-3 w-3" /> };
  };

  const status = getStatusInfo(task.actType);
  const isFinished = task.actType === ActType.TaskFinished || task.actType === ActType.ArrivedAtDestination;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          fixed
          right-0 top-0 bottom-0 left-auto
          translate-x-0 translate-y-0
          h-full w-full sm:w-[400px]
          rounded-none
          border-l border-slate-200
          p-0
          shadow-2xl
          gap-0
          outline-none
        "
      >
        <div className="flex flex-col h-full bg-white">
          <DialogHeader className="p-5 border-b bg-slate-50 shrink-0">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Task Details
            </DialogTitle>
            <div className="text-xs text-slate-500 mt-1">
              ID: <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">{task.taskId}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            {/* Quick Status */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                Current Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatusCard
                  label="Status"
                  value={status.label}
                  variant={status.variant}
                  icon={status.icon}
                />
                <StatusCard
                  label="Execution"
                  value={task.isExcute ? "Yes" : "No"}
                  variant={task.isExcute ? "success" : "default"}
                />
              </div>
            </section>

            {/* Actions (Commands) - Moved up for visibility */}
            {!isFinished && (
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Play className="h-3 w-3" />
                  Commands
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-10 text-xs hover:cursor-pointer border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-bold rounded-lg flex items-center gap-2 transition-all"
                    onClick={() => onExecuteTask(task.taskId)}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Execute
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 text-xs hover:cursor-pointer border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-bold rounded-lg flex items-center gap-2 transition-all"
                    onClick={() => onCancelTask(task.taskId)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </section>
            )}

            {/* Task Info */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Bot className="h-3 w-3" />
                Assignment
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <DetailRow label="Robot ID" value={task.robotId} isMono />
                <DetailRow label="Action" value={task.actType ? (ActTypeLabel[task.actType] || "None") : "None"} />
                <DetailRow label="Business ID" value={task.businessId} isMono />
                <DetailRow label="Building ID" value={task.buildingId} isMono />
              </div>
            </section>

            {/* Timestamps */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Timeline
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <DetailRow label="Created At" value={formattedDate} />
                <DetailRow label="Source" value={task.sourceType} />
                <DetailRow label="Business Type" value={task.busiType} />
              </div>
            </section>
          </div>

          <div className="p-4 border-t bg-slate-50 shrink-0">
            <Button
              variant="secondary"
              className="w-full h-10 hover:cursor-pointer rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types/TaskTypes";
import { ClipboardList, Calendar, Bot, Activity, CheckCircle2, Play, Pause } from "lucide-react";
import { ActType, getActLabel } from "@/lib/types/TaskTypes";
import { StatusCard, DetailRow } from "@/components/ui/sheet-info";
import { useTranslation } from "react-i18next";

type ViewTaskProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onExecuteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
};

export default function ViewTaskSheet({ open, onOpenChange, task, onExecuteTask, onCancelTask }: ViewTaskProps) {
  const { t } = useTranslation();
  if (!task) return null;

  const date = task.createTime ? new Date(Number(task.createTime)) : null;
  const formattedDate = date && !isNaN(date.getTime()) ? date.toLocaleString("en-US", { timeZone: "Europe/Berlin" }) : "---";

  const getStatusInfo = (actType?: ActType) => {
    if (!actType) return { label: t('common.unknown'), variant: "default" as const, icon: <Activity className="h-3 w-3" /> };

    if (actType === ActType.TaskFinished || actType === ActType.ArrivedAtDestination) {
      return { label: t('tasks.status.finished'), variant: "success" as const, icon: <CheckCircle2 className="h-3 w-3" /> };
    }
    if (actType === ActType.TaskPaused) {
      return { label: t('tasks.status.paused'), variant: "warning" as const, icon: <Pause className="h-3 w-3" /> };
    }
    if (actType === ActType.GoToDestination || actType === ActType.TaskStarted) {
      return { label: t('tasks.status.executing'), variant: "info" as const, icon: <Play className="h-3 w-3" /> };
    }
    return { label: getActLabel(t, actType), variant: "default" as const, icon: <Activity className="h-3 w-3" /> };
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
              {t('tasks.details.title')}
            </DialogTitle>
            <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest text-[10px]">
              {t('tasks.details.id')}: <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg ml-1 text-slate-700">{task.taskId}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            {/* Quick Status */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                {t('tasks.details.currentStatus')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatusCard
                  label={t('tasks.title')}
                  value={status.label}
                  variant={status.variant}
                  icon={status.icon}
                />
                <StatusCard
                  label={t('tasks.details.execution')}
                  value={task.isExcute ? t('common.yes') : t('common.no')}
                  variant={task.isExcute ? "success" : "default"}
                />
              </div>
            </section>

            {/* Actions (Commands) - Moved up for visibility */}
            {!isFinished && (
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Play className="h-3 w-3" />
                  {t('tasks.details.commands')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-10 text-xs hover:cursor-pointer border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-bold rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                    onClick={() => onExecuteTask(task.taskId)}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {t('tasks.actions.execute')}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 text-xs hover:cursor-pointer border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-bold rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                    onClick={() => onCancelTask(task.taskId)}
                  >
                    <Pause className="h-3.5 w-3.5" />
                    {t('tasks.actions.cancel')}
                  </Button>
                </div>
              </section>
            )}

            {/* Task Info */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Bot className="h-3 w-3" />
                {t('tasks.details.assignment')}
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <DetailRow label={t('tasks.details.robotLabel')} value={task.robotId} isMono />
                <DetailRow label={t('tasks.details.actionLabel')} value={getActLabel(t, task.actType)} />
                <DetailRow label={t('profile.businessDialog.businessId')} value={task.businessId} isMono />
                <DetailRow label={t('profile.businessDialog.buildingId')} value={task.buildingId} isMono />
              </div>
            </section>

            {/* Timestamps */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {t('tasks.details.timeline')}
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <DetailRow label={t('tasks.details.createdAt')} value={formattedDate} />
                <DetailRow label={t('tasks.details.source')} value={task.sourceType} />
                <DetailRow label={t('tasks.details.businessType')} value={task.busiType} />
              </div>
            </section>
          </div>

          <div className="p-4 border-t bg-slate-50 shrink-0">
            <Button
              variant="secondary"
              className="w-full h-10 hover:cursor-pointer rounded-lg text-xs font-black uppercase tracking-[0.2em] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all active:scale-[0.98]"
              onClick={() => onOpenChange(false)}
            >
              {t('tasks.actions.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

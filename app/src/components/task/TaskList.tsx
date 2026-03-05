import {
  List,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActType, type Task, getActLabel } from "@/lib/types/TaskTypes";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store";
import { getTask } from "@/lib/slices/TaskSlice";
import { useTranslation } from "react-i18next";

interface TaskListProps {
  tasks: Task[];
  selectedBusinessId: string | null;
  selectedTaskId?: string;
  onViewTask: (task: Task) => void;
}

export function TaskList({
  tasks,
  selectedBusinessId,
  selectedTaskId,
  onViewTask
}: TaskListProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  function getTaskStatus(task: Task): { label: string; className: string } {
    if (!task.actType) {
      return {
        label: "-",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }

    // Finished
    if (task.actType === ActType.TaskFinished || task.actType === ActType.ArrivedAtDestination) {
      return {
        label: t('tasks.status.finished'),
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }

    // Paused
    if (task.actType === ActType.TaskPaused) {
      return {
        label: t('tasks.status.paused'),
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      };
    }

    // Executing
    if (task.actType === ActType.GoToDestination || task.actType === ActType.TaskStarted) {
      return {
        label: t('tasks.status.executing'),
        className: "bg-green-100 text-green-700 border-green-200",
      };
    }

    // Fallback for unknown actType
    return {
      label: getActLabel(t, task.actType),
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  const handleViewTask = async (task: Task) => {
    await dispatch(getTask(task.taskId));

    onViewTask(task);
  };

  return (
    <Card className="border border-slate-200 shadow-none rounded-xl h-[50vh] min-h-[320px] lg:h-[460px] flex flex-col">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
          <List className="h-4 w-4" />
          {t('tasks.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-200">
          {tasks.filter((task) => task.businessId === selectedBusinessId).length === 0 ? (
            <div className="p-8 text-slate-400 text-sm text-center flex flex-col items-center gap-2">
              <List className="h-8 w-8 opacity-20" />
              <p>{t('tasks.noTasks')}</p>
            </div>
          ) : (
            tasks
              .filter((task) => task.businessId === selectedBusinessId)
              .map((task) => {
                const status = getTaskStatus(task);
                const date = task.createTime ? new Date(Number(task.createTime)) : null;
                const formattedDate =
                  date && !isNaN(date.getTime())
                    ? date.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
                    : "---";

                return (
                  <div
                    key={task.taskId}
                    className={cn(
                      "transition-all cursor-pointer p-4 flex justify-between items-start",
                      selectedTaskId === task.taskId ? "bg-blue-50" : "hover:bg-slate-50"
                    )}
                    onClick={() => handleViewTask(task)}
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm text-slate-800">
                        {task.taskId}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {t('tasks.details.robotLabel')}:{" "}
                        <span className="font-semibold text-slate-700">
                          {task.robotId}
                        </span>
                      </p>

                      <p className="text-xs text-slate-500">
                        {t('tasks.details.actionLabel')}:{" "}
                        <span className="font-semibold text-slate-700">
                          {getActLabel(t, task.actType)}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* STATUS BADGE */}
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide border ${status.className}`}
                      >
                        {status.label}
                      </span>

                      {/* DATE */}
                      <span className="text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

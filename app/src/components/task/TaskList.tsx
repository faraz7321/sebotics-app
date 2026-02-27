import {
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActTypeLabel, ActType, type Task } from "@/lib/types/TaskTypes";
import { useState } from "react";

interface TaskListProps {
  tasks: Task[];
  selectedBusinessId: string | null;
  onExecuteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  selectedBusinessId,
  onExecuteTask,
  onCancelTask
}: TaskListProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  function getActLabel(actType?: ActType) {
    if (!actType) return "—";
    return ActTypeLabel[actType] ?? `Act ${actType}`;
  };

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
        label: "Finished",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }

    // Paused
    if (task.actType === ActType.TaskPaused) {
      return {
        label: "Paused",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      };
    }

    // Executing
    if (task.actType === ActType.GoToDestination || task.actType === ActType.TaskStarted) {
      return {
        label: "Executing",
        className: "bg-green-100 text-green-700 border-green-200",
      };
    }

    // Fallback for unknown actType
    return {
      label: ActTypeLabel[task.actType as ActType] ?? `Act ${task.actType}`,
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }

  return (
    <Card className="border border-slate-200 shadow-none rounded-xl h-[50vh] min-h-[320px] lg:h-[460px] flex flex-col">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
          <List className="h-4 w-4" />
          Tasks
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        {tasks
          .filter((task) => task.businessId === selectedBusinessId)
          .map((task) => {
            const isSelected = selectedTaskId === task.taskId;

            const status = getTaskStatus(task);
            const date = task.createTime ? new Date(Number(task.createTime)) : null;
            const formattedDate =
              date && !isNaN(date.getTime())
                ? date.toLocaleString()
                : "---";

            return (
              <div
                key={task.taskId}
                className={`border-b transition-all cursor-pointer ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                onClick={() => setSelectedTaskId(isSelected ? null : task.taskId)}
              >
                {/* HEADER */}
                <div className="p-4 flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm text-slate-800">
                      {task.taskId}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Robot:{" "}
                      <span className="font-semibold text-slate-700">
                        {task.robotId}
                      </span>
                    </p>

                    <p className="text-xs text-slate-500">
                      Action:{" "}
                      <span className="font-semibold text-slate-700">
                        {getActLabel(task.actType)}
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

                {/* ACTIONS */}
                {isSelected && task.actType != ActType.TaskFinished && (
                  <div className="px-4 pb-4 pt-3 border-t border-slate-200 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-green-500 text-green-600 hover:bg-green-100 hover:cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecuteTask(task.taskId);
                      }}
                    >
                      Execute
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-100 hover:cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelTask(task.taskId);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
      </CardContent>
    </Card>
  )
}

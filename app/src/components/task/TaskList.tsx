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
import type { Task } from "@/lib/types/TaskTypes";
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

  return (
    <Card className="border border-slate-200 shadow-none rounded-xl h-[460px] flex flex-col">
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
                onClick={() =>
                  setSelectedTaskId(isSelected ? null : task.taskId)
                }
              >
                {/* COLLAPSED HEADER */}
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-sm text-slate-800">
                      {task.taskId}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Assigned to:{" "}
                      <span className="font-semibold text-slate-700">
                        {task.robotId}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Execution Status:{" "}
                      <span className="font-semibold text-slate-700">
                        {task.isExcute ? "Executing" : "Pending"}
                      </span>
                    </p>
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                    {formattedDate}
                  </span>
                </div>

                {/* EXPANDED ACTIONS */}
                {isSelected && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      className="w-full mb-2 border-green-500 text-green-600 hover:bg-green-100 hover:cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent collapse toggle
                        onExecuteTask(task.taskId);
                      }}
                    >
                      Execute Task
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-500 text-red-600 hover:bg-red-100 hover:cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent collapse toggle
                        onCancelTask(task.taskId);
                      }}
                    >
                      Cancel Task
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
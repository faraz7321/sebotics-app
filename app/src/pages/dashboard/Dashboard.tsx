import {
  AlertOctagon,
  Zap,
  Bot,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AddRobotModal } from "@/components/robots/AddRobotModal";
import type { Robot } from "@/lib/types/RobotTypes";
import type { Task } from "@/lib/types/TaskTypes";


const mockRobots: Robot[] = [
  { id: "r1", name: "Juno 1", location: "Dining Area", battery: 82, status: "serving" },
  { id: "r2", name: "Juno 2", location: "Kitchen", battery: 45, status: "idle" },
  { id: "r3", name: "Juno 3", location: "Hallway", battery: 67, status: "charging" },
  { id: "r4", name: "Juno 4", location: "Patio", battery: 91, status: "idle" },
];

const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Deliver food to Table 5",
    assignedRobot: "Juno 1",
    status: "in-progress",
  },
  {
    id: "t2",
    title: "Refill water stations",
    assignedRobot: "Juno 2",
    status: "pending",
  },
  {
    id: "t3",
    title: "Clean hallway",
    assignedRobot: "Juno 3",
    status: "completed",
  },
];


export default function Dashboard() {
  return (
    <div className="bg-slate-50 font-sans text-slate-900">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

        {/* LEFT PANEL - ROBOTS */}
        <div className="lg:col-span-4">
          <Card className="border border-slate-200 shadow-none rounded-xl h-[400px] flex flex-col">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
                <Bot className="h-4 w-4" />
                Robots
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-200">
                {mockRobots.map((robot) => (
                  <div
                    key={robot.id}
                    className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-sm">{robot.name}</p>
                      <p className="text-xs text-slate-500">{robot.location}</p>
                    </div>
                    <span className="text-xs text-slate-400">{robot.battery}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <AddRobotModal
            onAdd={(robot) => {
              console.log("New robot added:", robot);
            }}
          />

        </div>

        {/* RIGHT PANEL - TASKS */}
        <div className="lg:col-span-8">
          <Card className="border border-slate-200 shadow-none rounded-xl h-[460px] flex flex-col">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
                <List className="h-4 w-4" />
                Tasks
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 flex-1 overflow-y-auto">
              {mockTasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No tasks assigned
                </div>
              ) : (
                <div className="space-y-4">
                  {mockTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{task.title}</h3>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${task.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                            }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Assigned to: {task.assignedRobot}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
        <div className="border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto grid grid-col md:flex-row gap-4">
            <Button className="flex-1 h-14 rounded-xl bg-green-700 hover:bg-green-600 text-white font-medium gap-2">
              <Zap className="h-5 w-5" />
              Call Robot
            </Button>

            <Button
              variant="outline"
              className="flex-1 h-14 rounded-xl border-red-500 bg-white text-red-600 hover:bg-red-100 font-medium gap-2"
            >
              <AlertOctagon className="h-5 w-5 text-red-500" />
              Stop
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}

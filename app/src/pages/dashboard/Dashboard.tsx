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

import { listBusinesses } from "@/lib/slices/BusinessSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { useEffect, useState } from "react";
import { fetchUser, listUsers } from "@/lib/slices/UserSlice";

import type { Task } from "@/lib/types/TaskTypes";
import { listRobots } from "@/lib/slices/RobotSlice";
import type { Robot } from "@/lib/types/RobotTypes";
import { ROLES } from "@/config/constants";

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
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.user.user);

  useEffect(() => {
    const getBusinsesses = async () => {
      await dispatch(listBusinesses());
    }

    const getUsers = async () => {
      await dispatch(fetchUser());
      if (user?.role == ROLES.ADMIN) {
        await dispatch(listUsers());
      }
    }

    const getRobots = async () => {
      await dispatch(listRobots());
    }

    getBusinsesses();
    getUsers()
    getRobots();
  }, [dispatch]);

  const robots = useAppSelector((state) => state.robot.robots);
  const selectedBusinessId = useAppSelector((state) => state.business.selectedbusinessId);

  const filteredrobots = robots.filter((r) => r.businessId === selectedBusinessId);

  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);

  return (
    <div className="bg-slate-50 font-sans text-slate-900">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

        {/* ROBOTS LIST WITH EXPANDABLE DETAILS */}
        <div className="lg:col-span-4">
          <Card className="border border-slate-200 shadow-none rounded-xl h-[460px] flex flex-col">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
                <Bot className="h-4 w-4" />
                Robots
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-200">
                {filteredrobots.length === 0 ? (
                  <div className="p-4 text-slate-400 text-sm text-center">
                    No robots available
                  </div>
                ) : (
                  filteredrobots.map((robot) => {
                    const isSelected = selectedRobot?.robotId === robot.robotId;

                    return (
                      <div
                        key={robot.robotId}
                        className={`border-b cursor-pointer transition-all ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                        onClick={() =>
                          setSelectedRobot(isSelected ? null : robot)
                        }
                      >
                        {/* COLLAPSED HEADER */}
                        <div className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{robot.name || robot.robotId}</p>
                            <p className="text-xs text-slate-500">{robot.isOnLine ? "Online" : "Offline"}</p>
                          </div>
                          <span className="text-xs text-slate-400">{robot.battery}%</span>
                        </div>

                        {/* EXPANDED DETAILS */}
                        {isSelected && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-200 space-y-2 text-sm">
                            <div>
                              <span className="text-slate-500">Model:</span> {robot.model}
                            </div>
                            <div>
                              <span className="text-slate-500">Status:</span>{" "}
                              {robot.isTask
                                ? "Working"
                                : robot.isCharging
                                  ? "Charging"
                                  : robot.isOnLine
                                    ? "Idle"
                                    : "Offline"}
                            </div>
                            <div>
                              <span className="text-slate-500">Manual Mode:</span> {robot.isManualMode ? "Yes" : "No"}
                            </div>
                            <div>
                              <span className="text-slate-500">Remote Mode:</span> {robot.isRemoteMode ? "Yes" : "No"}
                            </div>
                            <div>
                              <span className="text-slate-500">Emergency Stop:</span> {robot.isEmergencyStop ? "Yes" : "No"}
                            </div>
                            <div>
                              <span className="text-slate-500">Coordinates:</span> ({robot.x}, {robot.y}) | Yaw: {robot.yaw}°
                            </div>
                            <div>
                              <span className="text-slate-500">Area:</span> {robot.areaId || "Unassigned"}
                            </div>
                            {robot.errors.length > 0 && (
                              <div className="text-red-500">
                                Errors: {robot.errors.join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
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

import {
  Bot,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Robot } from "@/lib/types/RobotTypes";
import { useEffect, useState } from "react";
import { robotStateSocket, taskStateSocket } from "@/lib/ws/stateSockets";

interface RobotListProps {
  robots: Robot[];
  onCallRobot: (robot: Robot) => void;
  onReturnToDock: (robot: Robot) => void;
}

export function RobotList({ robots, onCallRobot, onReturnToDock }: RobotListProps) {
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);

  useEffect(() => {
    if (robots.length === 0) return;

    // Connect socket if not already connected
    if (!robotStateSocket.isConnected()) {
      robotStateSocket.connect();
    }

    if (!taskStateSocket.isConnected()) {
      taskStateSocket.connect();
    }

    // Subscribe to all robots in the list
    robots.forEach((robot) => {
      robotStateSocket.subscribe(robot.robotId);
      taskStateSocket.subscribe(robot.robotId);
    });
    

  }, [robots]);

  return (
    <Card className="border border-slate-200 shadow-none rounded-xl h-[460px] flex flex-col">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
          <Bot className="h-4 w-4" />
          Robots
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-200">
          {robots && robots.length === 0 ? (
            <div className="p-4 text-slate-400 text-sm text-center">
              No robots available
            </div>
          ) : (
            robots.map((robot) => {
              const isSelected = selectedRobot?.robotId === robot.robotId;

              return (
                <div
                  key={robot.robotId}
                  className={`border-b cursor-pointer transition-all ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  onClick={() => setSelectedRobot(isSelected ? null : robot)}
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
                      <Button
                        variant="outline"
                        className="w-full mt-2 border-green-500 text-green-600 hover:bg-green-100 hover:cursor-pointer"
                        onClick={() => {
                          onCallRobot(robot);
                        }}
                      >
                        Call Robot
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full mt-2 border-green-500 text-green-600 hover:bg-green-100 hover:cursor-pointer"
                        onClick={() => onReturnToDock(robot)}
                      >
                        Return to Dock
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
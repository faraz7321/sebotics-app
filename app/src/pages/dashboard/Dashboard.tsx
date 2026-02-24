import {
  AlertOctagon,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { listBusinesses } from "@/lib/slices/BusinessSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { useEffect, useState } from "react";
import { fetchUser, listUsers } from "@/lib/slices/UserSlice";

import { CallRobotSheet } from "@/components/robot/CallRobotSheet";
import { EmergencyStopSheet } from "@/components/robot/EmergencyStopSheet";

import { listRobots } from "@/lib/slices/RobotSlice";
import { ROLES } from "@/config/constants";
import { listTasks } from "@/lib/slices/TaskSlice";
import { listPointsOfInterest } from "@/lib/slices/mapSlice";
import { RobotList } from "@/components/robot/RobotList";
import { TaskList } from "@/components/task/TaskList";

import {
  handleCreateTask,
  handleExecuteTask,
  handleCancelTask,
} from "@/lib/tasks/taskHandlers";
import { PoiType } from "@/lib/types/MapTypes";
import type { Robot } from "@/lib/types/RobotTypes";

export default function Dashboard() {
  const dispatch = useAppDispatch();

  const robots = useAppSelector((state) => state.robot.robots);
  const selectedBusinessId = useAppSelector((state) => state.business.selectedbusinessId);
  const tasks = useAppSelector((state) => state.task.tasks);
  const pois = useAppSelector((state) => state.map.pointsOfInterest);
  const filteredrobots = robots.filter((r) => r.businessId === selectedBusinessId);

  useEffect(() => {
    const getBusinesses = async () => {
      await dispatch(listBusinesses());
    }

    const getUsers = async () => {
      const response = await dispatch(fetchUser());
      if (fetchUser.fulfilled.match(response) && response.payload?.role === ROLES.ADMIN) {
        await dispatch(listUsers());
      }
    }

    const getRobots = async () => {
      await dispatch(listRobots());
    }

    getBusinesses();
    getUsers();
    getRobots();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedBusinessId) return;

    const fetchTasks = async () => {
      // time in miliseconds
      const now = Date.now();
      const twoHoursAgo = now - (2 * 60 * 60 * 1000);

      await dispatch(listTasks({
        businessId: selectedBusinessId,
        startTime: Number(twoHoursAgo),
        endTime: Number(now)
      }));
    }

    const fetchPointsOfInterest = async () => {
      await dispatch(listPointsOfInterest(selectedBusinessId));
    }

    fetchTasks();
    fetchPointsOfInterest();
  }, [selectedBusinessId, dispatch]);

  const [callOpen, setCallOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);

  const getPoisByRobotArea = (robot: Robot, poiType: PoiType) => {
    return pois.filter((poi) => {
      if (robot.areaId !== poi.areaId) {
        return false;
      }
      if (poiType !== undefined && poi.type !== poiType) {
        return false;
      }
      return true;
    });
  };

  const getChargingDock = (robot: Robot) => {
    if (!robot) {
      console.warn("Robot not found");
      return null;
    }
    
    const dock = getPoisByRobotArea(robot, PoiType.ChargingPile)[0];
    console.log(dock);

    if (!dock) {
      console.warn("No charging dock found in the same area as the robot");
      return null;
    }
    return dock;
  }

  const getIdleRobot = () => {
    const idleRobot = filteredrobots.find(
      (robot) => robot.isOnLine && !robot.isTask && !robot.isCharging
    );
    return idleRobot?.robotId;
  };

  const getOnlineRobot = () => {
    const onlineRobot = filteredrobots.find((robot) => robot.isOnLine);

    return onlineRobot?.robotId;
  };

  const handleReturnToDock = (robot: Robot) => {
    const chargingDock = getChargingDock(robot);
    if (!chargingDock) {
      console.error("No charging dock found for the robot's area");
      return;
    }

    handleCreateTask(dispatch, selectedBusinessId!, chargingDock, robot.robotId, true);
  };

  const handleEmergencyStop = (robotId: string) => {
    const taskId = tasks.find((t) => t.robotId === robotId && t.isExcute)?.taskId;

    console.log("Emergency stop:", robotId);
    console.log("Active task for robot:", taskId ?? "None");

    if (taskId) {
      handleCancelTask(dispatch, selectedBusinessId!, taskId);
    } else {
      console.warn("No active task found for robot:", robotId);
    }

  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

        {/* LEFT PANEL - ROBOTS */}
        <div className="lg:col-span-4">
          <RobotList
            robots={filteredrobots}
            onReturnToDock={(robot) => handleReturnToDock(robot)}
          />
        </div>


        {/* RIGHT PANEL - TASKS */}
        <div className="lg:col-span-8">
          <TaskList
            tasks={tasks}
            selectedBusinessId={selectedBusinessId}
            onExecuteTask={(taskId) =>
              handleExecuteTask(dispatch, selectedBusinessId!, taskId)
            }
            onCancelTask={(taskId) =>
              handleCancelTask(dispatch, selectedBusinessId!, taskId)
            }
          />
        </div>
      </div>


      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
        <div className="border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto grid grid-col md:flex-row gap-4">
            <Button
              disabled={!selectedBusinessId}
              onClick={() => setCallOpen(true)}
              className="flex-1 h-14 rounded-xl bg-green-700 hover:bg-green-600 text-white font-medium gap-2 hover:cursor-pointer disabled:bg-green-300 disabled:hover:bg-green-300 disabled:cursor-not-allowed"
            >
              <Zap className="h-5 w-5" />
              Call Robot
            </Button>

            <Button
              variant="outline"
              disabled={!selectedBusinessId}
              onClick={() => setStopOpen(true)}
              className="flex-1 h-14 rounded-xl border-red-500 bg-white text-red-600 hover:bg-red-100 font-medium gap-2 hover:cursor-pointer disabled:border-red-300 disabled:text-red-300 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              <AlertOctagon className="h-5 w-5 text-red-500" />
              Stop
            </Button>
          </div>
        </div>
      </div>

      { /* SHEETS / MODALS */}
      <CallRobotSheet
        open={callOpen}
        onOpenChange={setCallOpen}
        onCall={(poi) =>
          handleCreateTask(dispatch, selectedBusinessId!, poi, getIdleRobot() || getOnlineRobot() || "", true)
        }
      />

      <EmergencyStopSheet
        open={stopOpen}
        onOpenChange={setStopOpen}
        robots={filteredrobots}
        onStop={(robotId) => handleEmergencyStop(robotId)}
      />

    </div>
  );
}

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
import ViewRobotSheet from "@/components/robot/ViewRobotSheet";

import { listRobots } from "@/lib/slices/RobotSlice";
import { ROLES } from "@/config/constants";
import { listTasks } from "@/lib/slices/TaskSlice";
import { listPointsOfInterest } from "@/lib/slices/mapSlice";
import { RobotList } from "@/components/robot/RobotList";
import { TaskList } from "@/components/task/TaskList";
import ViewTaskSheet from "@/components/task/ViewTaskSheet";
import type { Task } from "@/lib/types/TaskTypes";

import {
  handleCreateTask,
  handleExecuteTask,
  handleCancelTask,
} from "@/lib/tasks/taskHandlers";
import { PoiType } from "@/lib/types/MapTypes";
import type { Robot } from "@/lib/types/RobotTypes";
import { useTranslation } from "react-i18next";
import { getCestTimestamp } from "@/lib/utils";
import { getIdleRobot, getOnlineRobot } from "@/lib/helpers/robotHelpers";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const robots = useAppSelector((state) => state.robot.robots);
  const selectedBusinessId = useAppSelector((state) => state.business.selectedBusinessId);
  const tasks = useAppSelector((state) => state.task.tasks);
  const pois = useAppSelector((state) => state.map.pointsOfInterest);
  const selectedBusinessRobots = robots.filter((r) => r.businessId === selectedBusinessId);

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
      // time in miliseconds, adjusted to CEST
      const now = getCestTimestamp();
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
  const [viewOpen, setViewOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [selectedRobotForCall, setSelectedRobotForCall] = useState<Robot | null>(null);
  const [selectedRobotForView, setSelectedRobotForView] = useState<Robot | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleCallRobot = (robot: Robot) => {
    setSelectedRobotForCall(robot);
    setCallOpen(true);
  };

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

  const handleReturnToDock = (robot: Robot) => {
    const chargingDock = getChargingDock(robot);
    if (!chargingDock) {
      console.error("No charging dock found for the robot's area");
      return;
    }

    handleCreateTask({
      dispatch: dispatch,
      businessId: selectedBusinessId!,
      poi: chargingDock,
      robotId: robot.robotId,
      execute: true,
      isV3: false
    });
  };

  const handleEmergencyStop = (robotId: string) => {
    const activeTasks = tasks.filter((t) => t.robotId === robotId && t.isExcute);

    console.log("Emergency stop for robot:", robotId);
    console.log("Active tasks found:", activeTasks.length);

    if (activeTasks.length > 0) {
      activeTasks.forEach((task) => {
        console.log("Stopping task:", task.taskId);
        handleCancelTask({ dispatch: dispatch, businessId: selectedBusinessId!, taskId: task.taskId });
      });
    } else {
      console.warn("No active tasks found for robot:", robotId);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 font-sans text-slate-900">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-6 pb-32 md:pb-28 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

        {/* LEFT PANEL - ROBOTS */}
        <div className="lg:col-span-4">
          <RobotList
            robots={selectedBusinessRobots}
            selectedRobotId={selectedRobotForView?.robotId}
            onViewRobot={(robot) => {
              setSelectedRobotForView(robot);
              setViewOpen(true);
            }}
          />
        </div>


        {/* RIGHT PANEL - TASKS */}
        <div className="lg:col-span-8">
          <TaskList
            tasks={tasks}
            selectedBusinessId={selectedBusinessId}
            selectedTaskId={selectedTask?.taskId}
            onViewTask={(task) => {
              setSelectedTask(task);
              setTaskOpen(true);
            }}
          />
        </div>
      </div>


      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
        <div className="border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <Button
              disabled={!selectedBusinessId}
              onClick={() => {
                setSelectedRobotForCall(null);
                setCallOpen(true);
              }}
              className="h-12 md:h-14 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold gap-2 hover:cursor-pointer disabled:bg-green-300 disabled:hover:bg-green-300 disabled:cursor-not-allowed transition-all"
            >
              <Zap className="h-5 w-5" />
              {t('dashboard.callRobot')}
            </Button>

            <Button
              variant="outline"
              disabled={!selectedBusinessId}
              onClick={() => setStopOpen(true)}
              className="h-12 md:h-14 rounded-xl border-red-500 bg-white text-red-600 hover:bg-red-100 font-bold gap-2 hover:cursor-pointer disabled:border-red-300 disabled:text-red-300 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <AlertOctagon className="h-5 w-5 text-red-500" />
              {t('dashboard.stop')}
            </Button>
          </div>
        </div>
      </div>

      { /* SHEETS / MODALS */}
      <CallRobotSheet
        open={callOpen}
        onOpenChange={setCallOpen}
        selectedRobot={selectedRobotForCall}
        onCall={(poi) => {
          handleCreateTask({
            dispatch: dispatch,
            businessId: selectedBusinessId!,
            poi: poi,
            robotId: selectedRobotForCall?.robotId || getIdleRobot(selectedBusinessRobots) || getOnlineRobot(selectedBusinessRobots) || "",
            execute: true,
            isV3: true
          });
        }}
      />

      <EmergencyStopSheet
        open={stopOpen}
        onOpenChange={setStopOpen}
        robots={selectedBusinessRobots}
        onStop={(robotId) => handleEmergencyStop(robotId)}
      />

      <ViewRobotSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        robot={selectedRobotForView}
        onCall={handleCallRobot}
        onReturnToDock={handleReturnToDock}
      />

      <ViewTaskSheet
        open={taskOpen}
        onOpenChange={setTaskOpen}
        task={selectedTask}
        onExecuteTask={(taskId) =>
          handleExecuteTask({ dispatch, businessId: selectedBusinessId!, taskId: taskId })
        }
        onCancelTask={(taskId) =>
          handleCancelTask({ dispatch, businessId: selectedBusinessId!, taskId: taskId })
        }
      />

    </div>
  );
}

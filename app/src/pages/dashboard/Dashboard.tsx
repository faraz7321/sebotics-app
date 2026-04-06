import { useEffect, useState } from "react";
import {
  AlertOctagon,
  Zap,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { listBusinesses } from "@/lib/slices/BusinessSlice";
import { getBaseMap, listPointsOfInterest, listAreas } from "@/lib/slices/mapSlice";
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import { fetchUser, listUsers } from "@/lib/slices/UserSlice";

import { RobotList } from "@/components/robot/RobotList";
import { TaskList } from "@/components/task/TaskList";

import { CallRobotModal } from "@/components/robot/CallRobotModal";
import { EmergencyStopSheet } from "@/components/robot/EmergencyStopSheet";
import { DropOffSheet } from "@/components/robot/DropOffSheet";
import { ViewRobotSheet } from "@/components/robot/ViewRobotSheet";
import { ViewTaskSheet } from "@/components/task/ViewTaskSheet";
import { IndoorMap } from "@/components/map/IndoorMap";

import { listRobots } from "@/lib/slices/RobotSlice";
import { listTasks } from "@/lib/slices/TaskSlice";

import { ROLES } from "@/config/constants";
import { API_ENDPOINTS } from "@/config/routes";
import type { Task, TaskOptions, TaskPoint } from "@/lib/types/TaskTypes";
import { PoiType, type PointOfInterest } from "@/lib/types/MapTypes";
import type { Robot } from "@/lib/types/RobotTypes";
import { getCestTimestamp } from "@/lib/utils";
import api from "@/lib/api/axios";

import {
  handleCreateDeliveryTask,
  handleCreateDropOffTask,
  handleCreateDockingTask,
  handleCancelTask,
} from "@/lib/tasks/taskHandlers";

import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const robots = useAppSelector((state: RootState) => state.robot.robots);
  const selectedBusinessId = useAppSelector((state: RootState) => state.business.selectedBusinessId);
  const tasks = useAppSelector((state: RootState) => state.task.tasks);
  const { selectedAreaId, pointsOfInterest } = useAppSelector((state: RootState) => state.map);

  const selectedAreaRobots = robots.filter((r: Robot) => r.businessId === selectedBusinessId && r.areaId === selectedAreaId);

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  useEffect(() => {
    api.get(API_ENDPOINTS.CONFIG.MAPBOX_TOKEN)
      .then(res => {
        setMapboxToken(res.data.token);
      })
      .catch(err => {
        console.error('Failed to fetch mapbox token:', err);
      });
  }, []);

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

    const fetchAreas = async () => {
      await dispatch(listAreas(selectedBusinessId));
    }

    fetchTasks();
    fetchPointsOfInterest();
    fetchAreas();
  }, [selectedBusinessId, dispatch]);

  useEffect(() => {
    if (!selectedAreaId) return;

    const fetchBaseMap = async () => {
      await dispatch(getBaseMap(selectedAreaId));
    }

    fetchBaseMap();
  }, [selectedAreaId, dispatch]);

  const [callOpen, setCallOpen] = useState(false);
  const [dropOffOpen, setDropOffOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const [selectedRobotForView, setSelectedRobotForView] = useState<Robot | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedPoiForCall, setSelectedPoiForCall] = useState<PointOfInterest | null>(null);
  const [activeTab, setActiveTab] = useState<'robots' | 'tasks'>('robots');

  const getChargingDock = (robot: Robot) => {
    if (!robot) return null;
    const dock = pointsOfInterest.find((p: PointOfInterest) => p.areaId === robot.areaId && p.type === PoiType.ChargingPile);
    return dock || null;
  };

  const handleCallRobot = (poi: PointOfInterest, options?: TaskOptions) => {
    let backPt: TaskPoint[] | undefined;
    let returnDest = 2; // no return by default
    const robot = options?.robot;

    if (robot) {
      returnDest = 3;

      if (options?.returnType === 'current') {
        backPt = [{
          areaId: robot.areaId,
          x: robot.x,
          y: robot.y,
        }];
      } else if (options?.returnType === 'docking') {
        const dock = getChargingDock(robot);
        if (dock) {
          backPt = [{
            areaId: dock.areaId,
            poiId: dock.id,
            x: dock.coordinate[0],
            y: dock.coordinate[1],
          }];
        }
      }
    }

    handleCreateDeliveryTask({
      dispatch: dispatch,
      businessId: selectedBusinessId!,
      poi: poi,
      robotId: robot?.robotId,
      speed: options?.speed,
      returnDest: returnDest,
      backPt: backPt,
      execute: true,
      priority: options?.priority ?? false,
      isV3: true
    });
  };

  const handleEmergencyStop = (robotId: string) => {
    const activeTasks = tasks.filter((t: Task) => t.robotId === robotId && !t.isCancel);

    if (activeTasks.length > 0) {
      activeTasks.forEach((task) => {
        handleCancelTask({ dispatch: dispatch, businessId: selectedBusinessId!, taskId: task.taskId });
      });
    } else {
      console.warn("No active tasks found for robot:", robotId);
    }
  };

  const handleReturnToDock = (robot: Robot) => {
    const chargingDock = getChargingDock(robot);
    if (!chargingDock) {
      console.error("No charging dock found for the robot's area");
      return;
    }

    handleEmergencyStop(robot.robotId); // cancel all ongoing tasks

    handleCreateDockingTask({
      dispatch: dispatch,
      businessId: selectedBusinessId!,
      poi: chargingDock,
      robotId: robot.robotId,
      execute: true,
      priority: true, // immediately send to charging dock
      isV3: true
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 font-sans text-slate-900">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-2 md:p-4 pb-32 md:pb-28 w-full grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">

        {/* LEFT PANEL - MAP CONTAINER */}
        <div className="lg:col-span-8 flex">
          <IndoorMap
            mapboxToken={mapboxToken}
            onRobotSend={(poi) => {
              setSelectedPoiForCall(poi);
              setCallOpen(true);
            }}
          />
        </div>

        {/* RIGHT PANEL - TABS (ROBOTS & TASKS) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('robots')}
              className={`flex-1 cursor-pointer py-1.5 md:py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'robots' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('dashboard.robots', 'Robots')}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 cursor-pointer py-1.5 md:py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'tasks' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('dashboard.tasks', 'Tasks')}
            </button>
          </div>

          {activeTab === 'robots' ? (
            <div className="flex-1">
              <RobotList
                robots={selectedAreaRobots}
                selectedRobotId={selectedRobotForView?.robotId}
                onViewRobot={(robot: Robot) => {
                  setSelectedRobotForView(robot);
                  setViewOpen(true);
                }}
              />
            </div>
          ) : (
            <div className="flex-1">
              <TaskList
                tasks={tasks}
                selectedBusinessId={selectedBusinessId}
                selectedTaskId={selectedTask?.taskId}
                onViewTask={(task: Task) => {
                  setSelectedTask(task);
                  setTaskOpen(true);
                }}
              />
            </div>
          )}
        </div>
      </div>


      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-2">
        <div className="border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <Button
              disabled={!selectedBusinessId}
              onClick={() => {
                setSelectedPoiForCall(null);
                setCallOpen(true);
              }}
              className="h-12 md:h-14 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold gap-2 hover:cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200 disabled:cursor-not-allowed transition-all"
            >
              <Zap className="h-5 w-5" />
              <span className="hidden sm:inline">{t('dashboard.callRobot')}</span>
              <span className="sm:hidden text-xs">Call</span>
            </Button>

            <Button
              disabled={!selectedBusinessId}
              onClick={() => {
                setDropOffOpen(true);
              }}
              className="h-12 md:h-14 rounded-xl bg-orange-700 hover:bg-orange-600 text-white font-bold gap-2 hover:cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200 disabled:cursor-not-allowed transition-all"
            >
              <Package className="h-5 w-5" />
              <span className="hidden sm:inline">{t('dashboard.dropOff', 'Drop Off')}</span>
              <span className="sm:hidden text-xs">Drop Off</span>
            </Button>

            <Button
              variant="outline"
              disabled={!selectedBusinessId}
              onClick={() => setStopOpen(true)}
              className="h-12 md:h-14 rounded-xl border-red-500 bg-white text-red-600 hover:bg-red-100 font-bold gap-2 hover:cursor-pointer disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <AlertOctagon className="h-5 w-5 text-red-500" />
              <span className="hidden sm:inline">{t('dashboard.stop')}</span>
              <span className="sm:hidden text-xs">Stop</span>
            </Button>
          </div>
        </div>
      </div>

      { /* SHEETS / MODALS */}
      <CallRobotModal
        open={callOpen}
        onOpenChange={setCallOpen}
        onCall={handleCallRobot}
        initialPoi={selectedPoiForCall}
      />

      <DropOffSheet
        open={dropOffOpen}
        onOpenChange={setDropOffOpen}
        onDropOff={(pickup, dropoff) => {
          handleCreateDropOffTask({
            dispatch: dispatch,
            businessId: selectedBusinessId!,
            pois: [pickup, dropoff],
            execute: true,
            priority: false,
            isV3: true
          });
        }}
      />

      <EmergencyStopSheet
        open={stopOpen}
        onOpenChange={setStopOpen}
        robots={selectedAreaRobots}
        onStop={(robotId) => handleEmergencyStop(robotId)}
      />

      <ViewRobotSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        robot={selectedRobotForView}
        onReturnToDock={handleReturnToDock}
      />

      <ViewTaskSheet
        open={taskOpen}
        onOpenChange={setTaskOpen}
        task={selectedTask}
        onCancelTask={(taskId) =>
          handleCancelTask({ dispatch: dispatch, businessId: selectedBusinessId!, taskId: taskId })
        }
      />

    </div>
  );
}

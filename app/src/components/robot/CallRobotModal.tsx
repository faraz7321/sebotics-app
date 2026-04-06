/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import type { PointOfInterest } from "@/lib/types/MapTypes";
import { useAppSelector, type RootState } from "@/store";
import { Loader } from "../ui/loader";
import { useTranslation } from "react-i18next";
import {
  Cpu,
  Gauge,
  RotateCcw,
  MapPin,
  Zap,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "../ui/separator";
import type { Robot } from "@/lib/types/RobotTypes";
import type { TaskOptions } from "@/lib/types/TaskTypes";

type CallRobotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCall: (poi: PointOfInterest, options: TaskOptions) => void;
  initialPoi?: PointOfInterest | null;
};

export function CallRobotModal({ open, onOpenChange, onCall, initialPoi }: CallRobotProps) {
  const { t } = useTranslation();
  const robots = useAppSelector((state: RootState) => state.robot.robots);
  const selectedBusinessId = useAppSelector((state: RootState) => state.business.selectedBusinessId);
  const { loading, pointsOfInterest, selectedAreaId } = useAppSelector((state: RootState) => state.map);

  const [targetRobot, setTargetRobot] = useState<Robot | 'automatic'>('automatic');
  const [speed, setSpeed] = useState<number>(1);
  const [returnType, setReturnType] = useState<'none' | 'current' | 'docking'>('none');
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const [priority, setPriority] = useState(false);

  // The effective POI to dispatch to
  const activePoi = initialPoi ?? selectedPoi;

  useEffect(() => {
    if (open) {
      setTargetRobot('automatic');
      setSpeed(1);
      setReturnType('none');
      setSelectedPoi(null);
      setPriority(false);
    }
  }, [open]);

  useEffect(() => {
    if (targetRobot === 'automatic') {
      setPriority(false);
    }
  }, [targetRobot]);

  const onlineRobots = useMemo(() => {
    return robots.filter((r: Robot) => r.isOnLine && r.businessId === selectedBusinessId);
  }, [robots, selectedBusinessId]);

  const filteredPois = useMemo(() => {
    if (targetRobot !== 'automatic') {
      return pointsOfInterest.filter((poi: PointOfInterest) => poi.areaId === targetRobot.areaId);
    }
    return pointsOfInterest.filter((poi: PointOfInterest) => poi.areaId === selectedAreaId);
  }, [pointsOfInterest, targetRobot, selectedAreaId]);

  const handleCall = (poi: PointOfInterest) => {
    onCall(poi, {
      robot: targetRobot === 'automatic' ? undefined : targetRobot,
      speed: speed,
      returnType: returnType,
      priority: priority && targetRobot !== 'automatic'
    });
    onOpenChange(false);
  };

  const handleSelectPoi = (poi: PointOfInterest) => {
    setSelectedPoi(prev => prev?.id === poi.id ? null : poi);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] md:w-full rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-xl">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">
                {t('robots.actions.callTitle')}
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Configure and dispatch your robot</p>
            </div>
          </div>
        </DialogHeader>

        <div>
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* Robot Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <span>{t('robots.fields.robot', 'Robot')}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between rounded-xl px-3 py-2 h-10 border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all"
                  >
                    <span className="truncate">
                      {targetRobot === 'automatic'
                        ? t('common.automatic', 'Automatic')
                        : targetRobot.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px] rounded-xl shadow-lg border-slate-100 p-1">
                  <DropdownMenuItem
                    className="rounded-lg cursor-pointer py-2 focus:bg-primary focus:text-white"
                    onClick={() => setTargetRobot('automatic')}
                  >
                    {t('common.automatic', 'Automatic')}
                  </DropdownMenuItem>
                  {onlineRobots.map(robot => (
                    <DropdownMenuItem
                      key={robot.robotId}
                      className="rounded-lg cursor-pointer py-2 focus:bg-primary focus:text-white"
                      onClick={() => setTargetRobot(robot)}
                    >
                      {robot.name || robot.robotId}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Speed Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Gauge className="h-3.5 w-3.5 text-primary" />
                <span>{t('tasks.fields.speed', 'Speed')}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between rounded-xl px-3 py-2 h-10 border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all"
                  >
                    <span className="truncate">
                      {speed}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[140px] rounded-xl shadow-lg border-slate-100 p-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <DropdownMenuItem
                      key={s}
                      className="rounded-lg cursor-pointer py-2 focus:bg-blue-600 focus:text-white"
                      onClick={() => setSpeed(s)}
                    >
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Return Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <RotateCcw className="h-3.5 w-3.5 text-primary" />
                <span>{t('tasks.fields.return', 'Return Behavior')}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between rounded-xl px-3 py-2 h-10 border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">
                        {[
                          { value: 'none', label: t('tasks.return.none', 'No return') },
                          { value: 'current', label: t('tasks.return.current', 'Current position') },
                          { value: 'docking', label: t('tasks.return.docking', 'Docking point') },
                        ].find(item => item.value === returnType)?.label}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-4rem)] md:w-[200px] rounded-xl shadow-lg border-slate-100 p-1">
                  {[
                    { value: 'none', label: t('tasks.return.none', 'No return') },
                    { value: 'current', label: t('tasks.return.current', 'Current position') },
                    { value: 'docking', label: t('tasks.return.docking', 'Docking point') },
                  ].map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      className="rounded-lg cursor-pointer py-2 focus:bg-orange-600 focus:text-white"
                      onClick={() => setReturnType(item.value as 'none' | 'current' | 'docking')}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Priority Selection */}
            <div className={`space-y-2 transition-opacity ${targetRobot === 'automatic' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-primary" />
                <span>{t('tasks.fields.priority', 'Priority')}</span>
              </div>
              <Button
                variant="outline"
                className={`w-full cursor-pointer justify-between rounded-xl px-3 py-2 h-10 border-slate-200 text-xs font-semibold transition-all ${priority ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800' : 'hover:bg-slate-50'}`}
                onClick={() => setPriority(!priority)}
              >
                <span className="truncate">
                  {priority ? t('common.yes', 'Yes') : t('common.no', 'No')}
                </span>
                <div className={`w-8 h-4 rounded-full transition-colors flex items-center p-0.5 ${priority ? 'bg-orange-500' : 'bg-slate-200'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${priority ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* DESTINATIONS SECTION */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{t('robots.actions.destination', 'Destination')}</span>
            </div>

            {initialPoi ? (
              /* Locked destination — from map pin click */
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="bg-green-100 p-2 rounded-lg shrink-0">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex flex-col gap-0 min-w-0">
                  <span className="font-bold text-slate-900 text-sm truncate">{initialPoi.name || t('robots.actions.unnamed')}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('robots.actions.type')}: {initialPoi.type}</span>
                </div>
                <Zap className="h-4 w-4 text-green-600 ml-auto shrink-0" />
              </div>
            ) : (
              /* Selectable list — tap to set destination, then call from footer */
              <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {!loading ? (
                  <>
                    {filteredPois && filteredPois.length > 0 ? (
                      filteredPois.map((poi) => {
                        const isSelected = selectedPoi?.id === poi.id;
                        return (
                          <button
                            key={poi.id}
                            type="button"
                            className={`w-full cursor-pointer h-14 px-4 flex justify-between items-center rounded-xl border transition-all ${isSelected
                              ? 'bg-green-50 border-green-300 shadow-sm'
                              : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/80 hover:border-slate-200'
                              }`}
                            onClick={() => handleSelectPoi(poi)}
                          >
                            <div className="flex flex-col items-start gap-0">
                              <span className={`font-bold text-sm ${isSelected ? 'text-green-800' : 'text-slate-900'}`}>
                                {poi.name ? poi.name : t('robots.actions.unnamed')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('robots.actions.type')}: {poi.type}</span>
                            </div>
                            <div className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-green-600 shadow-md shadow-green-200' : 'bg-white shadow-sm'
                              }`}>
                              <MapPin className={`h-4 w-4 transition-colors ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <MapPin className="ml-auto mr-auto h-8 w-8 text-slate-200 mb-2" />
                        <p className="text-sm text-slate-400 font-medium">{t('robots.actions.noDestinations')}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12">
                    <Loader variant="container" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/30">
          <Button
            variant="ghost"
            className="flex-1 h-10 rounded-xl hover:bg-slate-200/50 text-slate-600 font-bold hover:cursor-pointer transition-colors text-sm"
            onClick={() => onOpenChange(false)}
          >
            {t('robots.actions.cancel')}
          </Button>
          {activePoi && (
            <Button
              disabled={onlineRobots.length === 0}
              className="flex-[2] h-10 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold gap-2 animate-in slide-in-from-right-4 duration-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              onClick={() => handleCall(activePoi)}
            >
              <Zap className="h-4 w-4" />
              <span>Call to {activePoi.name || activePoi.id}</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

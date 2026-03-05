import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Robot } from "@/lib/types/RobotTypes";
import { Battery, Info, Activity, ShieldAlert, Zap, Bot } from "lucide-react";
import { StatusCard, DetailRow } from "@/components/ui/sheet-info";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type ViewRobotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  robot: Robot | null;
  onCall: (robot: Robot) => void;
  onReturnToDock: (robot: Robot) => void;
};

export default function ViewRobotSheet({ open, onOpenChange, robot, onCall, onReturnToDock }: ViewRobotProps) {
  const { t } = useTranslation();
  if (!robot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          fixed
          left-0 top-0 bottom-0 right-auto
          translate-x-0 translate-y-0
          h-full w-full sm:w-[380px]
          rounded-none
          border-r border-slate-200
          p-0
          shadow-2xl
          gap-0
        "
      >
        <div className="flex flex-col h-full bg-white">
          <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <Bot className="h-6 w-6 text-blue-600" />
              {t('robots.details.title')}
            </DialogTitle>
            <div className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest text-[10px]">
              {t('robots.details.serial')}: <span className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg ml-1 text-slate-700">{robot.robotId}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 p-5 space-y-6 overflow-hidden flex flex-col">
            {/* Status Grid */}
            <section className="shrink-0">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                {t('robots.details.liveStatus')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatusCard
                  label={t('robots.details.network')}
                  value={robot.isOnLine ? t('robots.status.online') : t('robots.status.offline')}
                  variant={robot.isOnLine ? "success" : "error"}
                />
                <StatusCard
                  label={t('robots.details.power')}
                  value={`${robot.battery}%`}
                  icon={<Battery className={cn("h-3 w-3", robot.battery < 20 ? "text-red-500" : "text-slate-400")} />}
                />
                <StatusCard
                  label={t('robots.details.task')}
                  value={robot.isTask ? t('robots.details.active') : t('robots.details.idle')}
                  active={robot.isTask}
                />
                <StatusCard
                  label={t('robots.details.mode')}
                  value={robot.isManualMode ? t('robots.details.manual') : t('robots.details.auto')}
                  variant={robot.isManualMode ? "warning" : "default"}
                />
              </div>
            </section>

            {/* Machine Data */}
            <section className="flex-1 min-h-0 flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Info className="h-3 w-3" />
                {t('robots.details.machineData')}
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 overflow-y-auto">
                <DetailRow label={t('robots.details.displayName')} value={robot.name || t('common.none')} />
                <DetailRow label={t('robots.details.hardwareModel')} value={robot.model || t('common.na')} />
                <DetailRow label={t('robots.details.mac')} value={robot.mac} isMono />
                <DetailRow label={t('robots.details.area')} value={robot.areaId} />
                <DetailRow label={t('robots.details.coordinates')} value={`${robot.x.toFixed(1)}, ${robot.y.toFixed(1)}`} />
              </div>
            </section>

            {/* Safety Indicator */}
            <section className="shrink-0">
              <div className={cn(
                "p-3 rounded-lg border flex items-center justify-between transition-all",
                robot.isEmergencyStop
                  ? "bg-red-50 border-red-200 text-red-700 shadow-sm shadow-red-100"
                  : "bg-slate-50 border-slate-100 text-slate-600"
              )}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className={cn("h-4 w-4", robot.isEmergencyStop ? "text-red-600 animate-pulse" : "text-slate-400")} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('robots.emergencyStop')}</span>
                </div>
                <span className="text-[10px] font-black">{robot.isEmergencyStop ? t('robots.details.emergencyStopEngaged') : t('robots.details.emergencyStopOff')}</span>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="shrink-0">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Zap className="h-3 w-3" />
                {t('robots.actions.callTitle')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-10 text-xs hover:cursor-pointer border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all font-bold rounded-lg shadow-sm active:scale-95"
                  onClick={() => onCall(robot)}
                >
                  {t('robots.actions.callTitle')}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 text-xs hover:cursor-pointer border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all font-bold rounded-lg shadow-sm active:scale-95"
                  onClick={() => onReturnToDock(robot)}
                >
                  {t('robots.actions.docking')}
                </Button>
              </div>
            </section>
          </div>

          <div className="p-4 border-t bg-slate-50/50 shrink-0">
            <Button
              variant="secondary"
              className="w-full h-10 hover:cursor-pointer rounded-lg text-xs font-black uppercase tracking-[0.2em] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all active:scale-[0.98]"
              onClick={() => onOpenChange(false)}
            >
              {t('robots.actions.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

type ViewRobotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  robot: Robot | null;
  onCall: (robot: Robot) => void;
  onReturnToDock: (robot: Robot) => void;
};

export default function ViewRobotSheet({ open, onOpenChange, robot, onCall, onReturnToDock }: ViewRobotProps) {
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
              Robot Details
            </DialogTitle>
            <div className="text-sm text-slate-500 mt-1">
              Serial: <span className="font-mono text-xs bg-slate-200 px-1.5 py-0.5 rounded">{robot.robotId}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 p-5 space-y-6 overflow-hidden flex flex-col">
            {/* Status Grid */}
            <section className="shrink-0">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                Live Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatusCard
                  label="Network"
                  value={robot.isOnLine ? "Online" : "Offline"}
                  variant={robot.isOnLine ? "success" : "error"}
                />
                <StatusCard
                  label="Power"
                  value={`${robot.battery}%`}
                  icon={<Battery className={cn("h-3 w-3", robot.battery < 20 ? "text-red-500" : "text-slate-400")} />}
                />
                <StatusCard
                  label="Task"
                  value={robot.isTask ? "Active" : "Idle"}
                  active={robot.isTask}
                />
                <StatusCard
                  label="Mode"
                  value={robot.isManualMode ? "Manual" : "Auto"}
                  variant={robot.isManualMode ? "warning" : "default"}
                />
              </div>
            </section>

            {/* Machine Data */}
            <section className="flex-1 min-h-0 flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Info className="h-3 w-3" />
                Machine Data
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 overflow-y-auto">
                <DetailRow label="Display Name" value={robot.name || "None"} />
                <DetailRow label="Hardware Model" value={robot.model || "N/A"} />
                <DetailRow label="MAC" value={robot.mac} isMono />
                <DetailRow label="Area" value={robot.areaId} />
                <DetailRow label="Coordinates" value={`${robot.x.toFixed(1)}, ${robot.y.toFixed(1)}`} />
              </div>
            </section>

            {/* Safety Indicator */}
            <section className="shrink-0">
              <div className={cn(
                "p-3 rounded-lg border flex items-center justify-between transition-colors",
                robot.isEmergencyStop
                  ? "bg-red-50 border-red-200 text-red-700 shadow-sm shadow-red-100"
                  : "bg-slate-50 border-slate-100 text-slate-600"
              )}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className={cn("h-4 w-4", robot.isEmergencyStop ? "text-red-600" : "text-slate-400")} />
                  <span className="text-xs font-bold uppercase tracking-wider">Emergency Stop</span>
                </div>
                <span className="text-[10px] font-black">{robot.isEmergencyStop ? "ENGAGED" : "OFF"}</span>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="shrink-0">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Zap className="h-3 w-3" />
                Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-10 text-xs hover:cursor-pointer border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all font-semibold rounded-lg"
                  onClick={() => onCall(robot)}
                >
                  Call Robot
                </Button>
                <Button
                  variant="outline"
                  className="h-10 text-xs hover:cursor-pointer border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all font-semibold rounded-lg"
                  onClick={() => onReturnToDock(robot)}
                >
                  Docking
                </Button>
              </div>
            </section>
          </div>

          <div className="p-4 border-t bg-slate-50/50 shrink-0">
            <Button
              variant="secondary"
              className="w-full h-10 hover:cursor-pointer rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

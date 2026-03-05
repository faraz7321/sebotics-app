import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { AlertOctagon } from "lucide-react";
import type { Robot } from "@/lib/types/RobotTypes";
import { useTranslation } from "react-i18next";

type EmergencyStopProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  robots: Robot[];
  onStop: (robotId: string) => void;
};

export function EmergencyStopSheet({
  open,
  onOpenChange,
  robots,
  onStop,
}: EmergencyStopProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          fixed
          bottom-0 left-0 right-0 top-auto
          translate-x-0 translate-y-0
          max-w-none w-full
          rounded-t-2xl rounded-b-none
          border-t
          p-0
        "
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center text-red-600 flex items-center justify-center gap-2">
            <AlertOctagon className="h-5 w-5" />
            {t('robots.emergencyStop')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {robots.length === 0 ? (
            <div className="text-center text-sm text-slate-400">
              {t('robots.noRobots')}
            </div>
          ) : (
            robots.map((robot) => (
              <Button
                key={robot.robotId}
                variant="outline"
                className="w-full h-12 justify-between border-red-100 hover:bg-red-100 hover:cursor-pointer"
                onClick={() => {
                  onStop(robot.robotId);
                  onOpenChange(false);
                }}
              >
                <span>{robot.name || robot.robotId}</span>
                <span className="text-xs text-slate-500">
                  {robot.isOnLine ? t('robots.status.online') : t('robots.status.offline')}
                </span>
              </Button>
            ))
          )}
        </div>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full hover:cursor-pointer hover:bg-slate-200"
            onClick={() => onOpenChange(false)}
          >
            {t('robots.actions.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

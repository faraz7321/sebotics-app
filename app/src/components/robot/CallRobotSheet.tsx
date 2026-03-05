import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import type { PointOfInterest } from "@/lib/types/MapTypes";
import type { Robot } from "@/lib/types/RobotTypes";
import { useAppSelector } from "@/store";
import { Loader } from "../ui/loader";
import { useTranslation } from "react-i18next";

type CallRobotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCall: (poi: PointOfInterest) => void;
  selectedRobot?: Robot | null;
};

export function CallRobotSheet({ open, onOpenChange, onCall, selectedRobot }: CallRobotProps) {
  const { t } = useTranslation();
  const robots = useAppSelector((state) => state.robot.robots);
  const { loading, pointsOfInterest } = useAppSelector((state) => state.map);

  const filteredPois = pointsOfInterest.filter((poi) => {
    if (selectedRobot) {
      return poi.areaId === selectedRobot.areaId;
    } else {
      return robots.some((robot) => robot.areaId === poi.areaId);
    }
  });

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
          <DialogTitle className="text-center">
            {selectedRobot ? `${t('robots.actions.callTitle')} ${selectedRobot.robotId}` : t('robots.actions.callTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {!loading ? <>
            {filteredPois && filteredPois.length > 0 ? (
              filteredPois.map((poi) => (
                <Button
                  key={poi.id}
                  variant="outline"
                  className="w-full h-12 justify-between hover:bg-slate-100 hover:cursor-pointer"
                  onClick={() => {
                    onCall(poi);
                    onOpenChange(false);
                  }}
                >
                  <span>{t('robots.actions.type')}: {poi.type} {poi.name ? poi.name : t('robots.actions.unnamed')}</span>
                </Button>
              ))
            ) : (
              <div className="text-center text-sm text-slate-400">
                {t('robots.actions.noDestinations')}
              </div>
            )}
          </> : (
            <div>
              <Loader variant="container" />
            </div>
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

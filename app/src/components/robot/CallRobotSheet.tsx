import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import type { PointOfInterest } from "@/lib/types/MapTypes";
import { useAppSelector } from "@/store";

type CallRobotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCall: (poi: PointOfInterest) => void;
};

export function CallRobotSheet({ open, onOpenChange, onCall }: CallRobotProps) {
  const { loading, pointsOfInterest } = useAppSelector((state) => state.map);

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
            Call Robot
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {!loading ? <>
            {pointsOfInterest && pointsOfInterest.length > 0 ? (
              pointsOfInterest.map((poi) => (
                <Button
                  key={poi.id}
                  variant="outline"
                  className="w-full h-12 justify-between hover:bg-slate-100 hover:cursor-pointer"
                  onClick={() => {
                    onCall(poi);
                    onOpenChange(false);
                  }}
                >
                  <span>{poi.name ? poi.name : "Unnamed"}</span>
                </Button>
              ))
            ) : (
              <div className="text-center text-sm text-slate-400">
                No destinations available
              </div>
            )} 
          </> : (
            <div className="text-center text-sm text-slate-400">
              Loading destinations...
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full hover:cursor-pointer hover:bg-slate-200"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

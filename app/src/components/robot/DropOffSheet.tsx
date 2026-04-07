import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PointOfInterest } from "@/lib/types/MapTypes";
import { useAppSelector } from "@/store";
import { Loader } from "../ui/loader";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Check, Package, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type DropOffSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDropOff: (pickup: PointOfInterest, dropoff: PointOfInterest) => void;
};

export function DropOffSheet({ open, onOpenChange, onDropOff }: DropOffSheetProps) {
  const { t } = useTranslation();
  const { loading, pointsOfInterest } = useAppSelector((state) => state.map);
  const selectedAreaId = useAppSelector((state) => state.map.selectedAreaId);

  const [pickup, setPickup] = useState<PointOfInterest | null>(null);
  const [dropoff, setDropoff] = useState<PointOfInterest | null>(null);

  // Filter POIs that belong to selectedArea
  const filteredPois = pointsOfInterest.filter((poi: PointOfInterest) => poi.areaId === selectedAreaId);

  const handleCreate = () => {
    if (pickup && dropoff) {
      onDropOff(pickup, dropoff);
      onOpenChange(false);
    }
  };

  const resetSelection = () => {
    setPickup(null);
    setDropoff(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetSelection();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 max-w-none w-full rounded-t-3xl rounded-b-none border-t border-slate-200 bg-white p-0 shadow-2xl transition-all duration-300 ease-in-out">
        <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <Package className="h-6 w-6 text-green-600" />
            {t('dashboard.dropOffTask', 'New Drop Off Task')}
          </DialogTitle>
          <p className="text-center text-sm text-slate-500 mt-1">
            {t('dashboard.dropOffDescription', 'Select both pick-up and drop-off points')}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader />
              <p className="text-sm text-slate-500 animate-pulse">Loading destinations...</p>
            </div>
          ) : (
            <>
              {/* Pick Up Point */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</div>
                  <h3 className="text-sm font-bold text-slate-700 tracking-tight">Select Pick Up Point</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {filteredPois.map((poi) => (
                    <button
                      key={`pickup-${poi.id}`}
                      onClick={() => setPickup(poi)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 font-medium text-left",
                        pickup?.id === poi.id
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100 shadow-sm"
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className={cn("h-4 w-4", pickup?.id === poi.id ? "text-blue-500" : "text-slate-400")} />
                        <span>{poi.name || poi.id} <span className="text-xs opacity-60 ml-1">({poi.type})</span></span>
                      </div>
                      {pickup?.id === poi.id && <Check className="h-5 w-5" />}
                    </button>
                  ))}
                  {filteredPois.length === 0 && (
                    <div className="text-center py-4 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No points available in this area
                    </div>
                  )}
                </div>
              </div>

              {/* Drop Off Point */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">2</div>
                  <h3 className="text-sm font-bold text-slate-700 tracking-tight">Select Drop Off Point</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {filteredPois.map((poi) => (
                    <button
                      key={`dropoff-${poi.id}`}
                      onClick={() => setDropoff(poi)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 font-medium text-left",
                        dropoff?.id === poi.id
                          ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-100 shadow-sm"
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className={cn("h-4 w-4", dropoff?.id === poi.id ? "text-green-500" : "text-slate-400")} />
                        <span>{poi.name || poi.id} <span className="text-xs opacity-60 ml-1">({poi.type})</span></span>
                      </div>
                      {dropoff?.id === poi.id && <Check className="h-5 w-5" />}
                    </button>
                  ))}
                  {filteredPois.length === 0 && (
                    <div className="text-center py-4 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No points available in this area
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-4">
          <Button
            variant="ghost"
            className="flex-1 h-12 hover:cursor-pointer rounded-xl text-slate-600 hover:bg-slate-100"
            onClick={() => handleOpenChange(false)}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            className="flex-[2] h-12 hover:cursor-pointer rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            disabled={!pickup || !dropoff || pickup.id === dropoff.id}
            onClick={handleCreate}
          >
            {pickup && dropoff && pickup.id === dropoff.id
              ? t('dashboard.pointsMustDiffer', 'Points must be different')
              : t('dashboard.startTask', 'Start Drop Off Task')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

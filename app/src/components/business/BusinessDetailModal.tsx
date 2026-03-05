import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Business } from "@/lib/types/BusinessTypes";

interface BusinessDetailModalProps {
  business: Business | null;
  onClose: () => void;
}

export function BusinessDetailModal({ business, onClose }: BusinessDetailModalProps) {
  const { t, i18n } = useTranslation();

  const formatBusinessCreatedTime = (value: string): string => {
    const createdAt = Number(value);
    if (!Number.isFinite(createdAt)) {
      return value;
    }
    return new Date(createdAt).toLocaleString(i18n.language);
  };

  return (
    <Dialog
      open={Boolean(business)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">{business?.name || t('profile.businessDialog.title')}</DialogTitle>
          <DialogDescription className="font-medium">
            {t('profile.businessDialog.description')}
          </DialogDescription>
        </DialogHeader>
        {business && (
          <div className="space-y-4 py-4 text-sm font-medium">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('profile.businessDialog.address')}</span>
              <span className="text-slate-700">{business.address || t('common.noAddress')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('profile.businessDialog.type')}</span>
              <span className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{business.type || t('common.na')}</span>
            </div>
            <div className="flex flex-col gap-1.5 py-2 border-b border-slate-50">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('profile.businessDialog.businessId')}</span>
              <span className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded-xl break-all">{business.id}</span>
            </div>
            <div className="flex flex-col gap-1.5 py-2 border-b border-slate-50">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('profile.businessDialog.buildingId')}</span>
              <span className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded-xl break-all">{business.buildingId || t('common.na')}</span>
            </div>
            <div className="flex flex-col gap-1.5 py-2 border-b border-slate-50">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('profile.businessDialog.customerId')}</span>
              <span className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded-xl break-all">{business.customerId || t('common.na')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('profile.businessDialog.created')}</span>
              <span className="text-slate-700">{formatBusinessCreatedTime(business.createdTime)}</span>
            </div>
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button type="button" variant="secondary" className="w-full hover:cursor-pointer rounded-2xl font-black uppercase tracking-widest text-xs h-12" onClick={onClose}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

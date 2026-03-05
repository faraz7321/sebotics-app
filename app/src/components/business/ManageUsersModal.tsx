import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { assignBusiness, unassignBusiness } from "@/lib/slices/BusinessSlice";
import { useTranslation } from "react-i18next";

type Props = {
  businessName: string;
  businessId: string;
  currentUserIds: string[];
};

export function ManageUsersModal({
  businessName,
  businessId,
  currentUserIds,
}: Props) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const users = useAppSelector((state) => state.user.users);

  const [open, setOpen] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<string[]>(currentUserIds);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    setAssignedUsers(currentUserIds);
    setPendingUserId(null);
  }, [businessId, currentUserIds]);

  const handleAssignToggle = async (userId: string) => {
    setPendingUserId(userId);

    if (assignedUsers.includes(userId)) {
      try {
        await dispatch(unassignBusiness({ businessId, userId })).unwrap();
        setAssignedUsers((prev) => prev.filter((id) => id !== userId));
      } finally {
        setPendingUserId(null);
      }
    } else {
      try {
        await dispatch(assignBusiness({ businessId, userId })).unwrap();
        setAssignedUsers((prev) => [...prev, userId]);
      } finally {
        setPendingUserId(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl font-bold hover:cursor-pointer" onClick={(e) => e.stopPropagation()}>
          {t('businessPanel.manageUsers')}
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t('businessPanel.manageTitle')} {businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/50 mt-4">
          {users.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium text-center py-8">{t('businessPanel.noUsersAvailable')}</p>
          ) : (
            users.map((user) => {
              const isAssigned = assignedUsers.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700">{user.username}</p>
                  </div>

                  <Button
                    size="sm"
                    className="hover:cursor-pointer rounded-lg font-bold min-w-[80px]"
                    variant={isAssigned ? "destructive" : "outline"}
                    disabled={pendingUserId === user.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignToggle(user.id);
                    }}
                  >
                    {isAssigned ? t('businessPanel.unassign') : t('businessPanel.assign')}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="secondary" className="hover:cursor-pointer rounded-xl font-bold w-full sm:w-auto" onClick={() => setOpen(false)}>
            {t('common.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

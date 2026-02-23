import { useState } from "react";
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
  const users = useAppSelector((state) => state.user.users);

  const [open, setOpen] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<string[]>(currentUserIds);

  const handleAssignToggle = async (userId: string) => {
    if (assignedUsers.includes(userId)) {
      // unassign
      await dispatch(unassignBusiness({ businessId, userId }));
      setAssignedUsers((prev) => prev.filter((id) => id !== userId));
    } else {
      // assign
      await dispatch(assignBusiness({ businessId, userId }));
      setAssignedUsers((prev) => [...prev, userId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
          Manage Users
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage {businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[320px] overflow-y-auto border rounded-lg p-3">
          {users.length === 0 ? (
            <p className="text-sm text-slate-400">No users available</p>
          ) : (
            users.map((user) => {
              const isAssigned = assignedUsers.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b last:border-b-0 pb-2"
                >
                  <div>
                    <p className="text-sm font-medium">{user.username}</p>
                  </div>

                  <Button
                    size="sm"
                    className="hover:cursor-pointer"
                    variant={isAssigned ? "destructive" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignToggle(user.id);
                    }}
                  >
                    {isAssigned ? "Unassign" : "Assign"}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="hover:cursor-pointer" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

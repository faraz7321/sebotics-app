import { ManageUsersModal } from "@/components/business/ManageUsersModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Business } from "@/lib/types/BusinessTypes";
import type { User } from "@/lib/types/UserTypes";

interface BusinessDetailsPanelProps {
  business: Business | null;
  users: User[];
}

export default function BusinessDetailsPanel({
  business,
  users,
}: BusinessDetailsPanelProps) {

  const assignedUsers = users.filter((u) =>
    business?.userIds.includes(u.id)
  );

  return (
    <Card className="border border-slate-200 shadow-none rounded-xl h-[600px] flex flex-col">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          {business ? business.name : "Select a business to view details"}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6 text-sm overflow-y-auto">

        {business ? (
          <>
            < div className="space-y-2">
              <div>
                <span className="text-slate-500">Business Name:</span>{" "}
                {business.name}
              </div>

              <div>
                <span className="text-slate-500">Address:</span>{" "}
                {business.address}
              </div>

              <div>
                <span className="text-slate-500">Users Count:</span>{" "}
                {assignedUsers.length}
              </div>
            </div>

            {/* USERS LIST */}
            <div className="space-y-2">
              <div className="text-slate-500 font-medium">
                Assigned Users
              </div>

              {assignedUsers.length === 0 ? (
                <div className="text-slate-400">
                  No users assigned
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border border-slate-200 rounded-md px-3 py-2"
                    >
                      {user.username}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="pt-2">
              <ManageUsersModal
                businessName={business.name}
                businessId={business.id}
                currentUserIds={business.userIds}
              />
            </div>
          </>
        ) : (
          <div className="h-[400px] rounded-xl flex items-center justify-center text-slate-400 text-sm">
            Select a business to view details
          </div>
        )}

      </CardContent>
    </Card >
  );
}

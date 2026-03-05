import { ManageUsersModal } from "@/components/business/ManageUsersModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Business } from "@/lib/types/BusinessTypes";
import type { User } from "@/lib/types/UserTypes";
import { useAppSelector } from "@/store";
import { Loader } from "../ui/loader";
import { useTranslation } from "react-i18next";

interface BusinessDetailsPanelProps {
  business: Business | null;
  users: User[];
}

export default function BusinessDetailsPanel({
  business,
  users,
}: BusinessDetailsPanelProps) {
  const { t } = useTranslation();
  const loading = useAppSelector((state) => state.business.loading);

  const assignedUsers = users.filter((u) =>
    business?.userIds.includes(u.id)
  );

  return (
    <Card className="border border-slate-200 shadow-none rounded-xl h-[55vh] min-h-[360px] lg:h-[600px] flex flex-col">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          {business ? business.name : t('businessPanel.selectPlaceholder')}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6 text-sm overflow-y-auto">
        {loading && !business ? (
          <Loader variant="container" />
        ) : business ? (
          <>
            <div className="space-y-2">
              <div>
                <span className="text-slate-500 font-medium">{t('businessPanel.businessName')}:</span>{" "}
                <span className="font-semibold text-slate-700">{business.name}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">{t('businessPanel.address')}:</span>{" "}
                <span className="font-semibold text-slate-700">{business.address}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">{t('businessPanel.usersCount')}:</span>{" "}
                <span className="font-semibold text-slate-700">{assignedUsers.length}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                {t('businessPanel.assignedUsers')}
              </div>

              {assignedUsers.length === 0 ? (
                <div className="text-slate-400 italic">
                  {t('businessPanel.noUsersAssigned')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium text-slate-600"
                    >
                      {user.username}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6">
              <ManageUsersModal
                businessName={business.name}
                businessId={business.id}
                currentUserIds={business.userIds}
              />
            </div>
          </>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-slate-400 font-medium">
            {t('businessPanel.selectPlaceholder')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

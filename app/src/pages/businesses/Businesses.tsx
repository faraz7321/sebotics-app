import BusinessDetailsPanel from "@/components/business/BusinessDetailsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listBusinesses, setSelectedBusinessId } from "@/lib/slices/BusinessSlice";
import { fetchUser, listUsers } from "@/lib/slices/UserSlice";
import type { Business } from "@/lib/types/BusinessTypes";
import { useAppDispatch, useAppSelector } from "@/store";
import { ArrowLeft, List } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { useTranslation } from "react-i18next";

export default function Businesses() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const users = useAppSelector((state) => state.user.users);
  const { businesses, selectedBusinessId } = useAppSelector(
    (state) => state.business
  );
  const selectedBusiness = businesses.find(
    (b) => b.id === selectedBusinessId
  ) || null;

  useEffect(() => {
    const getBusinsesses = async () => {
      await dispatch(listBusinesses());
    }

    const getUsers = async () => {
      await dispatch(listUsers());
      await dispatch(fetchUser());
    }

    getBusinsesses();
    getUsers()
  }, [dispatch]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50">
      <div className="max-w-[1600px] mx-auto relative px-4 md:px-10">
        {/* Back Button - Positioned to the side */}
        <div className="hidden md:block pt-6 md:pt-10 flex justify-start">
          <Button
            variant="ghost"
            className="hover:cursor-pointer text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl font-bold"
            onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('businessesPage.backToHome')}
          </Button>
        </div>

        {/* Main Content - Centered */}
        <div className="max-w-7xl mx-auto pt-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* LEFT — Businesses list */}
          <div className="col-span-1 lg:col-span-4 xl:col-span-4">
            <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl h-[55vh] min-h-[320px] lg:h-[600px] flex flex-col bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-100 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                  <List className="h-4 w-4" />
                  {t('businessesPage.title')}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 flex-1 overflow-y-auto relative">
                <div className="divide-y divide-slate-100">
                  {businesses.length === 0 ? (
                    <div className="p-8 text-slate-400 text-sm text-center italic font-medium">
                      {t('businessesPage.noBusinesses')}
                    </div>
                  ) : (
                    businesses.map((business: Business) => {
                      const isSelected = selectedBusinessId === business.id;

                      return (
                        <div
                          key={business.id}
                          className={`cursor-pointer transition-all duration-200 ${isSelected
                            ? "bg-slate-100 border-l-4 border-slate-600"
                            : "hover:bg-slate-50 border-l-4 border-transparent"
                            }`}
                          onClick={() =>
                            dispatch(
                              setSelectedBusinessId(
                                isSelected ? null : business.id
                              )
                            )
                          }
                        >
                          <div className="p-6 flex justify-between items-center">
                            <div>
                              <p className={`font-bold text-sm text-slate-700`}>
                                {business.name}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">{business.address || t('businessesPage.noAddress')}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500`}>
                              {users.filter(u => business.userIds.includes(u.id)).length} {t('businessesPage.users')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT — Business details */}
          <div className="col-span-1 lg:col-span-8 xl:col-span-8">
            <BusinessDetailsPanel
              business={selectedBusiness}
              users={users}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

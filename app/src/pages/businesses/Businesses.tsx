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

export default function Businesses() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
    <div className="h-full overflow-y-auto">
      <div className="pt-6 md:pt-10 px-4 md:px-10 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <div className="col-span-1 lg:col-span-12 flex items-center">
          <Button
            variant="outline"
            className="hover:cursor-pointer"
            onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* LEFT — Businesses list */}
        <div className="col-span-1 lg:col-span-4 xl:col-span-3">
          <Card className="border border-slate-200 shadow-none rounded-xl h-[55vh] min-h-[320px] lg:h-[600px] flex flex-col">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
                <List className="h-4 w-4" />
                Businesses
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto relative">
                <div className="divide-y divide-slate-200">
                  {businesses.length === 0 ? (
                    <div className="p-4 text-slate-400 text-sm text-center">
                      No businesses listed
                    </div>
                  ) : (
                    businesses.map((business: Business) => {
                      const isSelected = selectedBusinessId === business.id;

                      return (
                        <div
                          key={business.id}
                          className={`border-b cursor-pointer transition-all ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                          onClick={() =>
                            dispatch(
                              setSelectedBusinessId(
                                isSelected ? null : business.id
                              )
                            )
                          }
                        >
                          <div className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{business.name}</p>
                              <p className="text-xs text-slate-500">{business.address || "No address"}</p>
                            </div>
                            <span className="text-xs text-slate-400">{users.filter(u => business.userIds.includes(u.id)).length} Users</span>
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
        <div className="col-span-1 lg:col-span-8 xl:col-span-7">
          <BusinessDetailsPanel
            business={selectedBusiness}
            users={users}
          />
        </div>
      </div>
    </div>
  );
}

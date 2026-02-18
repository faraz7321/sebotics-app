import BusinessDetailsPanel from "@/components/business/BusinessDetailsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { listBusinesses } from "@/lib/slices/BusinessSlice";
import { listRobots } from "@/lib/slices/RobotSlice";
import { fetchUser, listUsers } from "@/lib/slices/UserSlice";
import type { Business } from "@/lib/types/BusinessTypes";
import { useAppDispatch, useAppSelector } from "@/store";
import { List } from "lucide-react";
import { useEffect, useState } from "react";

export default function Businesses() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const getBusinsesses = async () => {
      await dispatch(listBusinesses());
    }

    const getUsers = async () => {
      await dispatch(listUsers());
      await dispatch(fetchUser());
    }

    const getRobots = async () => {
      await dispatch(listRobots());
    }

    getBusinsesses();
    getUsers()
    getRobots();
  }, [dispatch]);

  const { loading, businesses } = useAppSelector((state) => state.business);
  const users = useAppSelector((state) => state.user.users);

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  return (
    <div className="pt-10 pl-50 grid grid-cols-12 gap-10">

      {/* LEFT — Businesses list */}
      <div className="col-span-3">
        <Card className="border border-slate-200 shadow-none rounded-xl h-[600px] flex flex-col">
          <CardHeader className="border-b border-slate-200 p-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
              <List className="h-4 w-4" />
              Businesses
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-y-auto relative">
            {!loading ? (
              <div className="divide-y divide-slate-200">
                {businesses.length === 0 ? (
                  <div className="p-4 text-slate-400 text-sm text-center">
                    No businesses listed
                  </div>
                ) : (
                  businesses.map((business: Business) => {
                    const isSelected = selectedBusiness?.id === business.id;

                    return (
                      <div
                        key={business.id}
                        className={`border-b cursor-pointer transition-all ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                        onClick={() => setSelectedBusiness(isSelected ? null : business)}
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
            ) : (
              <div>
                <Loader variant="container" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* RIGHT — Business details */}
      <div className="col-span-7">
        <BusinessDetailsPanel
          business={selectedBusiness}
          users={users}
        />
      </div>
    </div>
  );
}

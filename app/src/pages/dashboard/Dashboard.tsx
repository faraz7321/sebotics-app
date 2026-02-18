import {
  AlertOctagon,
  Zap,
  Bot,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AddRobotModal } from "@/components/robots/AddRobotModal";
import type { Robot } from "@/lib/types/RobotTypes";
import { listBusinesses } from "@/lib/slices/BusinessSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { useEffect, useState } from "react";
import { listUsers } from "@/lib/slices/UserSlice";
import type { Business } from "@/lib/types/BusinessTypes";
import { ManageUsersModal } from "@/components/business/ManageUsersModal";


const mockRobots: Robot[] = [
  { id: "r1", name: "Juno 1", location: "Dining Area", battery: 82, status: "serving" },
  { id: "r2", name: "Juno 2", location: "Kitchen", battery: 45, status: "idle" },
  { id: "r3", name: "Juno 3", location: "Hallway", battery: 67, status: "charging" },
  { id: "r4", name: "Juno 4", location: "Patio", battery: 91, status: "idle" },
];

export default function Dashboard() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const getBusinsesses = async () => {
      await dispatch(listBusinesses());
    }

    const getUsers = async () => {
      await dispatch(listUsers());
    }

    getBusinsesses();
    getUsers()
  }, [dispatch]);

  const businesses = useAppSelector((state) => state.business.businesses);
  const users = useAppSelector((state) => state.user.users);

  console.log(users);

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  return (
    <div className="bg-slate-50 font-sans text-slate-900">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

        {/* LEFT PANEL - ROBOTS */}
        <div className="lg:col-span-4">
          <Card className="border border-slate-200 shadow-none rounded-xl h-[400px] flex flex-col">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
                <Bot className="h-4 w-4" />
                Robots
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-200">
                {mockRobots.map((robot) => (
                  <div
                    key={robot.id}
                    className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-sm">{robot.name}</p>
                      <p className="text-xs text-slate-500">{robot.location}</p>
                    </div>
                    <span className="text-xs text-slate-400">{robot.battery}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <AddRobotModal
            onAdd={(robot) => {
              console.log("New robot added:", robot);
            }}
          />

        </div>

        {/* RIGHT PANEL - BUSINESSES */}
        <div className="lg:col-span-8">
          <Card className="border border-slate-200 shadow-none rounded-xl h-[460px] flex flex-col">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
                <List className="h-4 w-4" />
                Businesses
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 flex-1 overflow-y-auto">
              {businesses.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No businesses listed.
                </div>
              ) : (
                <div className="space-y-4">
                  {businesses.map((business: Business) => {
                    const isSelected = selectedBusiness?.id === business.id;

                    return (
                      <div
                        key={business.id}
                        onClick={() =>
                          setSelectedBusiness(isSelected ? null : business)
                        }
                        className={`border rounded-lg transition-all duration-200 cursor-pointer
                          ${isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {/* COLLAPSED HEADER */}
                        <div className="p-4 flex justify-between items-center">
                          <h3 className="font-medium">{business.name}</h3>
                          <span className="text-xs font-semibold px-2 py-1 rounded">
                            {business.address}
                          </span>
                        </div>

                        {/* EXPANDED DETAILS */}
                        {isSelected && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-200 space-y-3 text-sm">
                            <div>
                              <span className="text-slate-500">Business Name:</span>{" "}
                              {business.name}
                            </div>

                            <div>
                              <span className="text-slate-500">Users:</span>{" "}
                              {business.userIds.length == 0
                                ? "No users assigned"
                                : users
                                  .filter((u) => business.userIds.includes(u.id))
                                  .map((u) => u.username)
                                  .join(", ")}
                            </div>

                            <div className="flex gap-2 pt-2">
                              <ManageUsersModal
                                businessName={business.name}
                                businessId={business.id}
                                currentUserIds={business.userIds}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
        <div className="border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto grid grid-col md:flex-row gap-4">
            <Button className="flex-1 h-14 rounded-xl bg-green-700 hover:bg-green-600 text-white font-medium gap-2">
              <Zap className="h-5 w-5" />
              Call Robot
            </Button>

            <Button
              variant="outline"
              className="flex-1 h-14 rounded-xl border-red-500 bg-white text-red-600 hover:bg-red-100 font-medium gap-2"
            >
              <AlertOctagon className="h-5 w-5 text-red-500" />
              Stop
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}

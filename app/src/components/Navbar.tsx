import { Store, ChevronDown, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { logout } from "@/lib/slices/AuthSlice";

import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedBusinessId } from "@/lib/slices/BusinessSlice";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { ROLES } from "@/config/constants";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isManageBusinessesPage = location.pathname === ROUTES.BUSINESSES.PAGE;

  const user = useAppSelector((state) => state.user.user);
  const businesses = useAppSelector((state) => state.business.businesses);
  const selectedBusinessId = useAppSelector((state) => state.business.selectedbusinessId);

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return (
    <header className="bg-white border-b border-slate-200 p-4 grid grid-cols-3 items-center">

      {/* LEFT — Logo */}
      <div className="flex items-center">
        <h1
          className="text-xl font-bold text-slate-800 hover:cursor-pointer"
          onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
        >
          Sebotics
        </h1>
      </div>

      {/* CENTER — Business dropdown */}
      <div className="flex justify-center">
        {!isManageBusinessesPage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-3 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
              >
                <Store className="h-4 w-4 text-slate-500" />
                <span className="font-medium">{selectedBusiness?.name || "Select Business"}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="center"
              className="w-64 bg-white border border-slate-200 rounded-lg shadow-sm"
            >
              {businesses.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  className="cursor-pointer"
                  onClick={() => dispatch(setSelectedBusinessId(b.id))}
                >
                  {b.name}
                </DropdownMenuItem>
              ))}

              {user?.role === ROLES.ADMIN && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => navigate(ROUTES.BUSINESSES.PAGE)}
                >
                  Manage Businesses
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* RIGHT — Logout */}
      <div className="flex justify-end items-center">
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer"
          onClick={() => dispatch(logout())}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

    </header>
  );
}

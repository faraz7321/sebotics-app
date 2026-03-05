import { Store, ChevronDown, LogOut, UserIcon, KeyRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { logout } from "@/lib/slices/AuthSlice";
import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedBusinessId } from "@/lib/slices/BusinessSlice";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { ROLES } from "@/config/constants";
import { robotStateSocket, taskStateSocket } from "@/lib/ws/stateSockets";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isManageBusinessesPage = location.pathname === ROUTES.BUSINESSES.PAGE;

  const user = useAppSelector((state) => state.user.user);
  const businesses = useAppSelector((state) => state.business.businesses);
  const selectedBusinessId = useAppSelector((state) => state.business.selectedBusinessId);

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  const handleLogout = () => {
    robotStateSocket.disconnect();
    taskStateSocket.disconnect();
    dispatch(logout());
  };

  return (
    <header className="bg-white border-b border-slate-200 px-3 py-2 md:p-4 grid grid-cols-[auto,1fr,auto] md:grid-cols-3 items-center gap-2 md:gap-4">

      {/* LEFT — Logo */}
      <div className="flex items-center min-w-0">
        <h1
          className="text-lg md:text-xl font-bold text-slate-800 hover:cursor-pointer truncate"
          onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
        >
          Sebotics
        </h1>
      </div>

      {/* CENTER — Business dropdown */}
      <div className="flex justify-center min-w-0">
        {!isManageBusinessesPage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 md:h-10 w-full max-w-[170px] sm:max-w-[220px] md:max-w-[300px] gap-2 md:gap-3 px-2.5 sm:px-3 md:px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:cursor-pointer justify-between"
              >
                <div className="flex items-center min-w-0 gap-2">
                  <Store className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-medium text-xs sm:text-sm md:text-base truncate">
                    {selectedBusiness?.name || t('nav.selectBusiness')}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="center"
              className="w-64 bg-white border border-slate-200 rounded-lg shadow-sm"
            >
              <div className="max-h-64 overflow-y-auto">
                {businesses.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-slate-500">{t('nav.noBusinesses')}</div>
                ) : (
                  businesses.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      className="cursor-pointer"
                      onClick={() => dispatch(setSelectedBusinessId(b.id))}
                    >
                      {b.name}
                    </DropdownMenuItem>
                  ))
                )}
              </div>

              {user?.role === ROLES.ADMIN && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 hover:cursor-pointer"
                  onClick={() => navigate(ROUTES.BUSINESSES.PAGE)}
                >
                  {t('nav.manageBusinesses')}
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* LEFT- User Dropdown */}
      <div className="flex justify-end items-center gap-2">
        <Separator orientation="vertical" className="h-8 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="h-9 md:h-10 flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-emerald-50 border border-slate-100 cursor-pointer transition-all">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <UserIcon className="h-4 w-4" />
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl">
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:cursor-pointer" onClick={() => navigate(ROUTES.USER.PROFILE)}>
              <UserIcon className="mr-2 h-4 w-4" /> {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:cursor-pointer" onClick={() => navigate(ROUTES.USER.CHANGE_PASSWORD)}>
              <KeyRound className="mr-2 h-4 w-4" /> {t('nav.password')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:cursor-pointer text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import {
  Store,
  ChevronDown,
  LogOut,
  UserIcon,
  MapIcon,
  Menu,
  LayoutDashboard,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { logout } from "@/lib/slices/AuthSlice";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedBusinessId } from "@/lib/slices/BusinessSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { ROLES } from "@/config/constants";
import { robotStateSocket, taskStateSocket } from "@/lib/ws/stateSockets";
import { useState } from "react";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navTo = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-50">

      {/* LEFT: Mobile Menu + Desktop Logo */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu (Mobile Only) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-slate-100">
              <Menu className="h-6 w-6 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            <SheetHeader className="p-6 border-b border-slate-100 text-left">
              <SheetTitle className="flex items-center gap-2 text-emerald-600">
                <span className="font-bold text-xl tracking-tight text-slate-800">Sebotics</span>
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 px-4 py-6 space-y-2">
              <MobileNavLink
                icon={<LayoutDashboard className="h-5 w-5" />}
                label="Dashboard"
                onClick={() => navTo(ROUTES.DASHBOARD.HOME)}
                active={location.pathname === ROUTES.DASHBOARD.HOME}
              />
              <MobileNavLink
                icon={<MapIcon className="h-5 w-5" />}
                label="Maps"
                onClick={() => navTo(ROUTES.MAPS.PAGE)}
                active={location.pathname === ROUTES.MAPS.PAGE}
              />
              {user?.role === ROLES.ADMIN && (
                <MobileNavLink
                  icon={<Settings className="h-5 w-5" />}
                  label={t('nav.manageBusinesses')}
                  onClick={() => navTo(ROUTES.BUSINESSES.PAGE)}
                  active={isManageBusinessesPage}
                />
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 px-3 py-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-100 hover:bg-red-50 mb-2"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> {t('nav.logout')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Logo (Hidden on Mobile) */}
        <h1
          className="hidden md:block text-xl font-bold text-slate-800 hover:text-emerald-700 transition-colors cursor-pointer"
          onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
        >
          Sebotics
        </h1>
      </div>

      {/* CENTER: Business Switcher (Responsive width) */}
      {!isManageBusinessesPage && (
        <div className="flex-1 flex justify-center px-4 max-w-[400px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 hover:cursor-pointer w-full flex justify-between items-center gap-2 px-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center min-w-0 gap-2">
                  <Store className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-xs md:text-sm truncate">
                    {selectedBusiness?.name || t('nav.selectBusiness')}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="center" className="w-64 mt-2 rounded-xl shadow-lg border-slate-200 p-1">
              <div className="max-h-60 overflow-y-auto">
                {businesses.length === 0 ? (
                  <div className="px-2 py-3 text-center text-xs text-slate-400">
                    {t('nav.noBusinesses')}
                  </div>
                ) : (
                  businesses.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      className="rounded-lg cursor-pointer py-2.5 focus:bg-emerald-50 focus:text-emerald-700"
                      onClick={() => dispatch(setSelectedBusinessId(b.id))}
                    >
                      {b.name}
                    </DropdownMenuItem>
                  ))
                )}
              </div>

              {/* MANAGE BUSINESSES BUTTON (Admin Only) Hidden on Mobile*/}
              {user?.role === ROLES.ADMIN && (
                <div className="hidden md:block">
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                  <DropdownMenuItem
                    className="p-0 focus:bg-transparent"
                    onSelect={(e) => e.preventDefault()} // Prevents closing before click if desired
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full hover:cursor-pointer text-xs font-bold border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all rounded-lg"
                      onClick={() => {
                        navigate(ROUTES.BUSINESSES.PAGE);
                        setIsMobileMenuOpen(false); // Close sidebar if open
                      }}
                    >
                      <Settings className="mr-2 h-3.5 w-3.5" />
                      {t('nav.manageBusinesses')}
                    </Button>
                  </DropdownMenuItem>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* RIGHT: Desktop Nav Icons + User Dropdown */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Maps Button (Desktop Only) */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex hover:cursor-pointer items-center gap-2 px-3 h-10 rounded-xl hover:bg-emerald-50 text-slate-600 transition-all border border-transparent hover:border-emerald-100"
          onClick={() => navigate(ROUTES.MAPS.PAGE)}
        >
          <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <MapIcon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">Maps</span>
        </Button>

        <Separator orientation="vertical" className="h-6 hidden md:block bg-slate-200" />

        {/* User Action: Redirect on Mobile / Dropdown on Desktop */}
        <div className="flex items-center gap-1 md:gap-3">

          {/* MOBILE ONLY: Direct link to Profile */}
          <div
            className="md:hidden h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform shadow-sm"
            onClick={() => navigate(ROUTES.USER.PROFILE)}
          >
            <UserIcon className="h-4 w-4" />
          </div>

          {/* DESKTOP ONLY: Dropdown Menu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="h-10 hover:cursor-pointer flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-emerald-50 border border-slate-100 cursor-pointer transition-all">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl shadow-xl border-slate-200">
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-slate-800">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-3" onClick={() => navigate(ROUTES.USER.PROFILE)}>
                  <UserIcon className="mr-3 h-4 w-4 text-slate-500" /> {t('nav.profile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-3 text-red-600 focus:bg-red-50 focus:text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-3 h-4 w-4" /> {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

// Helper component for Mobile Sidebar Links
function MobileNavLink({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${active
        ? "bg-emerald-50 text-emerald-700 font-bold"
        : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
        }`}
    >
      {icon}
      <span className="text-base">{label}</span>
    </button>
  );
}
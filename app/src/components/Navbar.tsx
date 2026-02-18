import { Store, ChevronDown, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

import { Separator } from "./ui/separator";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/lib/slices/AuthSlice";


export default function Navbar() {
  const dispatch = useAppDispatch();

  const businesses = useAppSelector((state) => state.business.businesses);

  return (
    <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between" >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="gap-3 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
          >
            <Store className="h-4 w-4 text-slate-500" />
            <span className="font-medium">{businesses[0]?.name}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-64 bg-white border border-slate-200 rounded-lg shadow-sm"
        >
          {businesses.map((b) => (
            <DropdownMenuItem
              key={b.id}
              className="cursor-pointer"
            >
              {b.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center">
        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => dispatch(logout())}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header >
  );
}
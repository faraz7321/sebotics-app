import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function RootLayout() {
  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

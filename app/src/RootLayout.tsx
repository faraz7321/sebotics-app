import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { fetchUser } from "./lib/slices/UserSlice";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store";
import { refreshToken } from "./lib/slices/AuthSlice";
import { listBusinesses } from "./lib/slices/BusinessSlice";
import { useRobotSockets } from "./lib/hooks/useRobotSockets";

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.user);
  const { accessToken } = useAppSelector((state) => state.auth);
  const businesses = useAppSelector((state) => state.business.businesses);
  const businessLoading = useAppSelector((state) => state.business.loading);
  const businessesLoaded = useAppSelector((state) => state.business.hasLoaded);
  const keepLoggedIn = localStorage.getItem("keepLoggedIn") === "true";
  
  // Manage robot state sockets
  useRobotSockets();

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!keepLoggedIn) return;

      // Hard-refresh case: cookie still exists but accessToken in memory is empty.
      if (!accessToken) {
        const refreshed = await dispatch(refreshToken());
        if (refreshToken.fulfilled.match(refreshed)) {
          await dispatch(fetchUser());
        }
        return;
      }

      if (!user && !loading) {
        await dispatch(fetchUser());
      }
    };

    void bootstrapSession();
  }, [accessToken, user, loading, keepLoggedIn, dispatch]);

  useEffect(() => {
    if (!accessToken || businessLoading || businessesLoaded || businesses.length > 0) {
      return;
    }

    void dispatch(listBusinesses());
  }, [accessToken, businessLoading, businessesLoaded, businesses.length, dispatch]);


  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

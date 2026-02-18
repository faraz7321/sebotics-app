import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { fetchUser } from "./lib/slices/UserSlice";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store";

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.user);
  const { accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If we have a token but no user, fetch it immediately
    if (accessToken && !user) {
      dispatch(fetchUser());
    }
  }, [accessToken, user, loading, dispatch]);


  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

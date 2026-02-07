import { Button } from "@/components/ui/button";
import { logout } from "@/lib/slices/AuthSlice";
import { useAppDispatch } from "@/store";

export default function Dashboard() {
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800">
          Sebnotics
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => dispatch(logout())}>
            Logout
          </Button>
        </div>
      </nav>

      {/* Page Content */}
      <main className="p-8">
        <h1 className="text-3xl font-semibold mb-4">Welcome to your dashboard.</h1>
      </main>
    </div>
  );
}

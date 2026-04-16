import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-[#111827] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin topbar */}
        <header className="bg-[#1f2937] border-b border-slate-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-slate-500 hover:text-red-400 text-sm transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

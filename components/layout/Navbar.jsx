"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-[#1a2332] border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Question<span className="text-blue-400">S</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Courses
            </Link>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none bg-transparent border-0 p-0 cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {session.user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-slate-300 text-sm hidden sm:block">
                    {session.user?.name || session.user?.email}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#243447] border-slate-700 text-slate-300"
                >
                  <DropdownMenuItem className="text-xs text-slate-500 cursor-default">
                    {session.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {session.user?.role === "admin" && (
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/admin")}
                      className="hover:text-white cursor-pointer"
                    >
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

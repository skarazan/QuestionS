"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    const result = await signIn("user-credentials", {
      email: form.get("email"),
      password: form.get("password"),
      role: isAdmin ? "admin" : "user",
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      setLoading(false);
    } else {
      router.push(isAdmin ? "/admin" : callbackUrl);
      router.refresh();
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="min-h-screen bg-[#1a2332] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Question<span className="text-blue-400">S</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in to continue</p>
        </div>

        <div className="bg-[#243447] border border-slate-700 rounded-lg p-8">
          {/* Admin toggle */}
          <div className="flex bg-slate-800 rounded-md p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              className={`flex-1 text-sm py-1.5 rounded-sm transition-colors ${
                !isAdmin ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setIsAdmin(true)}
              className={`flex-1 text-sm py-1.5 rounded-sm transition-colors ${
                isAdmin ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm">Email</Label>
              <Input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="mt-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Password</Label>
              <Input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {!isAdmin && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-slate-700" />
                <span className="text-slate-500 text-xs">OR</span>
                <div className="flex-1 border-t border-slate-700" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center text-slate-400 text-sm mt-4">
                No account?{" "}
                <Link href="/register" className="text-blue-400 hover:underline">
                  Register
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

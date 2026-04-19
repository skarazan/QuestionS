import Link from "next/link";
import prisma from "@/lib/prisma";
import { RENTAL_PLANS, formatPriceCents } from "@/lib/rentalPlans";
import { Lock } from "lucide-react";

/**
 * Shown when a user tries to access course content without an active subscription.
 * Displays all enabled plans (price set on SiteSettings). Rent buttons are
 * disabled in Phase 1 (Stripe wires in Phase 2).
 */
export default async function Paywall({ title, subtitle, callbackUrl, isSignedIn }) {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  const plans = RENTAL_PLANS.map((p) => ({
    ...p,
    cents: settings[p.priceField],
  })).filter((p) => p.cents != null);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#243447] border border-slate-700 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-4">
          <Lock className="h-5 w-5 text-blue-400" />
        </div>
        <h2 className="text-white text-2xl font-semibold">
          {title || "Subscribe to unlock"}
        </h2>
        <p className="text-slate-400 mt-2">
          {subtitle ||
            "One subscription unlocks every course, quiz, and mock test on QuestionS."}
        </p>

        {!isSignedIn ? (
          <div className="mt-6">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl || "/")}`}
              className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Sign in to subscribe
            </Link>
            <p className="text-slate-500 text-xs mt-3">
              New here?{" "}
              <Link href="/register" className="text-blue-400 hover:underline">
                Create a free account
              </Link>
            </p>
          </div>
        ) : plans.length === 0 ? (
          <p className="text-slate-500 mt-6">
            Subscriptions aren&apos;t available for purchase yet. Contact an admin
            for access.
          </p>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-[#1f2937] border border-slate-700 rounded-lg p-4 text-left"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-white font-medium">{p.label}</span>
                  <span className="text-white text-xl font-bold">
                    {formatPriceCents(p.cents)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  title="Payments coming soon — contact admin for access"
                  className="mt-3 w-full px-3 py-2 bg-slate-700 text-slate-400 rounded text-sm cursor-not-allowed"
                >
                  Coming soon
                </button>
              </div>
            ))}
          </div>
        )}

        {isSignedIn && (
          <p className="text-slate-500 text-xs mt-6">
            Payments are rolling out soon. In the meantime, contact an admin to be
            granted access manually.
          </p>
        )}
      </div>
    </div>
  );
}

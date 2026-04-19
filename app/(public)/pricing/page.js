import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSubscription, daysRemaining } from "@/lib/subscription";
import { RENTAL_PLANS, formatPriceCents } from "@/lib/rentalPlans";
import { Check, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing — QuestionS",
};

export default async function PricingPage() {
  const [settings, session] = await Promise.all([
    prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    auth(),
  ]);

  const isAdmin = session?.user?.role === "admin";
  const userId = session?.user?.id;
  const sub = !isAdmin && userId ? await getSubscription(userId) : null;
  const activeSub = sub && sub.expiresAt > new Date() ? sub : null;

  const plans = RENTAL_PLANS.map((p) => ({
    ...p,
    cents: settings[p.priceField],
  }));

  const features = [
    "Access to every published course",
    "Unlimited practice quizzes",
    "All timed mock tests",
    "Progress tracking + explanations",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">Pricing</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          One subscription. Every course, quiz, and mock test on QuestionS.
        </p>
        {activeSub && (
          <div className="mt-4 inline-block bg-emerald-900 text-emerald-300 text-sm px-4 py-2 rounded-lg">
            You&apos;re subscribed · {daysRemaining(activeSub.expiresAt)} days left
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const available = p.cents != null;
          const highlight = p.id === "1mo";
          return (
            <div
              key={p.id}
              className={`rounded-lg p-6 flex flex-col ${
                highlight
                  ? "bg-[#1e293b] border-2 border-blue-500"
                  : "bg-[#243447] border border-slate-700"
              }`}
            >
              {highlight && (
                <div className="text-xs font-semibold text-blue-300 mb-2">
                  Most popular
                </div>
              )}
              <div className="text-white text-xl font-semibold">{p.label}</div>
              <div className="mt-3 text-white text-3xl font-bold">
                {available ? formatPriceCents(p.cents) : "—"}
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {available ? `for ${p.days} days` : "Coming soon"}
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {!session ? (
                  <Link
                    href={`/login?callbackUrl=/pricing`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    Sign in to subscribe
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Payments coming soon"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm cursor-not-allowed"
                  >
                    <Lock className="h-3.5 w-3.5" /> Coming soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {session && !activeSub && (
        <p className="text-slate-500 text-sm text-center mt-8">
          Payments are rolling out soon. Contact an admin for early access.
        </p>
      )}
    </div>
  );
}

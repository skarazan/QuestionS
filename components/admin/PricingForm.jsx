"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RENTAL_PLANS } from "@/lib/rentalPlans";

function centsToDollars(cents) {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

function dollarsToCents(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export default function PricingForm({ settings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({
    price15dCents: centsToDollars(settings.price15dCents),
    price1moCents: centsToDollars(settings.price1moCents),
    price1yrCents: centsToDollars(settings.price1yrCents),
    price2yrCents: centsToDollars(settings.price2yrCents),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const data = {
      price15dCents: dollarsToCents(prices.price15dCents),
      price1moCents: dollarsToCents(prices.price1moCents),
      price1yrCents: dollarsToCents(prices.price1yrCents),
      price2yrCents: dollarsToCents(prices.price2yrCents),
    };
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Pricing updated");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to update pricing");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <p className="text-slate-400 text-sm">
        Set the price for each plan in USD. Leave blank to disable a plan
        (it won&apos;t appear on the pricing page).
      </p>

      {RENTAL_PLANS.map((p) => (
        <div key={p.id}>
          <Label className="text-slate-300">{p.label}</Label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-slate-400">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={prices[p.priceField]}
              onChange={(e) =>
                setPrices((prev) => ({ ...prev, [p.priceField]: e.target.value }))
              }
              className="bg-slate-800 border-slate-600 text-white w-40"
            />
          </div>
        </div>
      ))}

      <Button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? "Saving..." : "Save Pricing"}
      </Button>
    </form>
  );
}

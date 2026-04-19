import prisma from "@/lib/prisma";
import PricingForm from "@/components/admin/PricingForm";

export default async function PricingPage() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Pricing</h1>
      <p className="text-slate-400 text-sm mb-6">
        Global subscription prices. A single subscription unlocks every published course.
      </p>
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
        <PricingForm settings={settings} />
      </div>
    </div>
  );
}

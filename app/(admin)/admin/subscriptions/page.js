import SubscriptionsManager from "@/components/admin/SubscriptionsManager";

export default function AdminSubscriptionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Subscriptions</h1>
      <p className="text-slate-400 text-sm mb-6">
        Grant, extend, or revoke site-wide subscriptions. One active subscription
        unlocks every published course for that user.
      </p>
      <SubscriptionsManager />
    </div>
  );
}

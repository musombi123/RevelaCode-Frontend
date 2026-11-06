import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useRevenueApi } from "@/services/revenueApi.jsx";

export default function PremiumPlansStar({ className = "" }) {
  const { user } = useAuth();
  const revenueApi = useRevenueApi();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    let active = true;
    const authenticated = Boolean(user?.id || user?.user_id || user?._id) && String(user?.role || "").toLowerCase() !== "guest";
    if (!authenticated) {
      setIsPremium(false);
      return () => { active = false; };
    }

    const loadSubscription = () => revenueApi.getMySubscription({ requestScope: "" })
      .then((response) => {
        if (!active) return;
        setIsPremium(response?.isPremium === true);
      })
      .catch((error) => {
        if (!active) return;
        setIsPremium(false);
        console.warn("[premium-payment] subscription badge unavailable", {
          status: error?.status || null,
          code: error?.code || error?.name || "subscription_unavailable",
        });
      });
    const handleSubscriptionUpdated = () => { loadSubscription(); };
    window.addEventListener("revelacode:subscription-updated", handleSubscriptionUpdated);
    loadSubscription();

    return () => {
      active = false;
      window.removeEventListener("revelacode:subscription-updated", handleSubscriptionUpdated);
    };
  }, [user?.id, user?.user_id, user?._id, user?.role, revenueApi]);

  const openPlans = () => {
    window.dispatchEvent(new CustomEvent("revelacode:premium-open", {
      detail: { planCode: "" },
    }));
  };

  return (
    <button
      type="button"
      onClick={openPlans}
      aria-label="Premium plans"
      title="Premium plans"
      data-premium-plans-star="true"
      data-demo="premium-star"
      className={"relative inline-flex h-10 w-auto min-w-10 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl border border-premium/30 bg-surface px-2.5 text-premium shadow-sm hover:bg-premium/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium/60 active:scale-95 " + className}
    >
      <Star className="h-5 w-5" strokeWidth={2.2} fill={isPremium ? "currentColor" : "none"} color="currentColor"/>
      <span className="hidden text-xs font-bold leading-none sm:inline">Premium</span>
      {isPremium ? (
        <span className="absolute -right-1 -top-1 rounded-full border-2 border-surface bg-premium px-1.5 py-0.5 text-[8px] font-black leading-none text-inverse">
          PRO
        </span>
      ) : null}
    </button>
  );
}

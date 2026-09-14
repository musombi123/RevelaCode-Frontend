import React from "react";
import {
  BellRing,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function getSeverity(alert) {
  const severity = String(
    alert?.severity ||
      alert?.priority ||
      "info"
  ).toLowerCase();

  if (
    ["critical", "urgent", "danger"].includes(
      severity
    )
  ) {
    return "critical";
  }

  if (
    ["warning", "high", "medium"].includes(
      severity
    )
  ) {
    return "warning";
  }

  if (
    ["success", "positive", "good"].includes(
      severity
    )
  ) {
    return "success";
  }

  return "info";
}

const STYLES = {
  critical: {
    wrapper: "border-red-200 bg-red-50",
    icon: "bg-red-100 text-red-600",
    title: "text-red-900",
    text: "text-red-700",
    Icon: XCircle,
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    title: "text-amber-900",
    text: "text-amber-700",
    Icon: AlertTriangle,
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    title: "text-emerald-900",
    text: "text-emerald-700",
    Icon: CheckCircle2,
  },
  info: {
    wrapper: "border-blue-200 bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    title: "text-blue-900",
    text: "text-blue-700",
    Icon: Info,
  },
};

export default function IntelligenceAlerts({
  alerts = [],
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <BellRing size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Intelligence Alerts
          </h2>

          <p className="text-xs text-slate-500">
            Important signals requiring attention
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
          <CheckCircle2
            size={20}
            className="shrink-0 text-emerald-600"
          />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              No urgent alerts
            </p>

            <p className="text-xs text-slate-500">
              Your intelligence system has no immediate warnings.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const severity = getSeverity(alert);
            const style = STYLES[severity];
            const Icon = style.Icon;

            return (
              <div
                key={
                  alert?.id ||
                  alert?._id ||
                  index
                }
                className={`rounded-2xl border p-4 ${style.wrapper}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold ${style.title}`}
                    >
                      {alert?.title ||
                        alert?.name ||
                        "Business intelligence alert"}
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${style.text}`}
                    >
                      {alert?.message ||
                        alert?.description ||
                        alert?.summary ||
                        "A new business signal requires your attention."}
                    </p>

                    {alert?.recommendation && (
                      <p
                        className={`mt-2 text-xs font-semibold ${style.text}`}
                      >
                        Recommended action:{" "}
                        {alert.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

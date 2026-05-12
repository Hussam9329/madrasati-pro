import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import type { MessageTone } from "@/lib/messages";

type SmartAlertProps = {
  title: string;
  description: string;
  tone?: MessageTone;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

const alertConfig: Record<
  MessageTone,
  {
    icon: React.ElementType;
    wrapperClass: string;
    iconClass: string;
    titleClass: string;
    actionClass: string;
  }
> = {
  info: {
    icon: Info,
    wrapperClass: "smart-alert-info",
    iconClass: "bg-sky-100 text-sky-700",
    titleClass: "text-sky-950",
    actionClass:
      "bg-sky-600 text-white hover:bg-sky-700 focus-visible:shadow-[0_0_0_4px_rgba(2,132,199,0.16)]",
  },
  success: {
    icon: CheckCircle2,
    wrapperClass: "smart-alert-success",
    iconClass: "bg-emerald-100 text-emerald-700",
    titleClass: "text-emerald-950",
    actionClass:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:shadow-[0_0_0_4px_rgba(22,163,74,0.16)]",
  },
  warning: {
    icon: AlertTriangle,
    wrapperClass: "smart-alert-warning",
    iconClass: "bg-amber-100 text-amber-700",
    titleClass: "text-amber-950",
    actionClass:
      "bg-amber-500 text-white hover:bg-amber-600 focus-visible:shadow-[0_0_0_4px_rgba(245,158,11,0.18)]",
  },
  danger: {
    icon: XCircle,
    wrapperClass: "smart-alert-danger",
    iconClass: "bg-red-100 text-red-700",
    titleClass: "text-red-950",
    actionClass:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:shadow-[0_0_0_4px_rgba(220,38,38,0.16)]",
  },
};

export function SmartAlert({
  title,
  description,
  tone = "info",
  actionLabel,
  actionHref,
  className,
}: SmartAlertProps) {
  const config = alertConfig[tone];
  const Icon = config.icon;

  return (
    <section
      className={[
        "smart-alert",
        config.wrapperClass,
        className ?? "",
      ].join(" ")}
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
    >
      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
          config.iconClass,
        ].join(" ")}
      >
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={[
            "text-base font-extrabold leading-7",
            config.titleClass,
          ].join(" ")}
        >
          {title}
        </h3>

        <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
          {description}
        </p>

        {actionLabel && actionHref ? (
          <div className="mt-4">
            <Link
              href={actionHref}
              className={[
                "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 text-sm font-extrabold transition",
                config.actionClass,
              ].join(" ")}
            >
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

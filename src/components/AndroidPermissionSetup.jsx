import React from "react";
import {
  Camera,
  Check,
  FileUp,
  BellRing,
  MapPin,
  Mic,
  ShieldCheck,
  Settings,
  X,
} from "lucide-react";
import {
  checkDevicePermissions,
  isNativeAndroid,
  openDeviceAppSettings,
  requestDevicePermission,
} from "../native/androidPermissions.js";

const STORAGE_KEY = "revelacode.android-permission-setup.v1";

const PERMISSION_ITEMS = [
  {
    key: "camera",
    title: "Camera",
    description: "Take profile photos, business images, and document photos.",
    Icon: Camera,
  },
  {
    key: "location",
    title: "Location",
    description: "Use nearby community, farm, and location-based tools when you choose them.",
    Icon: MapPin,
  },
  {
    key: "microphone",
    title: "Microphone",
    description: "Allow voice input and audio features when you choose to use them.",
    Icon: Mic,
  },
  {
    key: "notifications",
    title: "Notifications",
    description: "Receive important account, order, school, and community updates. You can change this anytime in Android settings.",
    Icon: BellRing,
  },
];

function isGranted(status) {
  return String(status || "").toLowerCase() === "granted";
}

function allGranted(statuses) {
  return PERMISSION_ITEMS.every((item) => isGranted(statuses?.[item.key]));
}

function readableStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "granted") return "Allowed";
  if (value === "denied") return "Denied in Android settings";
  if (value === "prompt-with-rationale") return "Permission needed";
  return "Not allowed yet";
}

export default function AndroidPermissionSetup() {
  const [visible, setVisible] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [statuses, setStatuses] = React.useState(null);
  const [selected, setSelected] = React.useState({
    camera: true,
    location: true,
    microphone: true,
    notifications: true,
  });
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!isNativeAndroid()) return undefined;

    let active = true;
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return undefined;
    } catch {
      // The permission screen can still operate if browser storage is unavailable.
    }

    checkDevicePermissions()
      .then((current) => {
        if (!active || !current) return;
        setStatuses(current);
        if (allGranted(current)) {
          try {
            window.localStorage.setItem(STORAGE_KEY, "complete");
          } catch {
            // Avoid blocking device setup when storage is unavailable.
          }
          return;
        }
        setSelected({
          camera: !isGranted(current.camera),
          location: !isGranted(current.location),
          microphone: !isGranted(current.microphone),
          notifications: !isGranted(current.notifications),
        });
        setVisible(true);
      })
      .catch(() => {
        // If native permission status cannot be read, do not block startup.
      });

    return () => {
      active = false;
    };
  }, []);

  const updateStatuses = React.useCallback(async () => {
    try {
      const current = await checkDevicePermissions();
      if (current) setStatuses(current);
      return current;
    } catch {
      setMessage("Android could not return the current permission status. You can check it in system settings.");
      return null;
    }
  }, []);

  const enableSelected = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      for (const item of PERMISSION_ITEMS) {
        if (!selected[item.key] || isGranted(statuses?.[item.key])) continue;
        try {
          await requestDevicePermission(item.key);
        } catch {
          // Continue so one denial does not prevent the other selected prompts.
        }
      }

      const latest = await updateStatuses();
      const requestedItems = PERMISSION_ITEMS.filter((item) => selected[item.key]);
      const allRequestedGranted = latest && requestedItems.every((item) => isGranted(latest[item.key]));
      if (allRequestedGranted) {
        try {
          window.localStorage.setItem(STORAGE_KEY, "complete");
        } catch {
          // Device permissions remain granted if the local marker cannot be saved.
        }
        setVisible(false);
        return;
      }
      setMessage("You can allow or deny each request. RevelaCode will still open; features that need denied access may be unavailable.");
    } finally {
      setBusy(false);
    }
  };

  const continueWithout = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      // Dismissing must always work.
    }
    setVisible(false);
  };

  const refreshAndUpdate = async () => {
    const latest = await updateStatuses();
    if (latest && allGranted(latest)) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "complete");
      } catch {
        // Ignore local marker failures.
      }
      setVisible(false);
    }
  };

  if (!visible || !isNativeAndroid()) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-md sm:p-6">
      <section
        aria-labelledby="android-permissions-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-white text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100"
        role="dialog"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 px-5 pb-6 pt-5 text-white sm:px-7 sm:pt-7">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 -top-3 h-24 w-24 rounded-full border border-white/10" />
          <button
            aria-label="Close device permission setup"
            className="absolute right-4 top-4 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            onClick={continueWithout}
            type="button"
          >
            <X size={18} />
          </button>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <ShieldCheck size={25} />
          </div>
          <p className="relative mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Device privacy setup
          </p>
          <h2 id="android-permissions-title" className="relative mt-2 max-w-md text-2xl font-bold leading-tight sm:text-3xl">
            Make the most of RevelaCode
          </h2>
          <p className="relative mt-2 max-w-lg text-sm leading-6 text-emerald-50/90">
            Choose which device features to enable. Android will ask for each selected permission, and you stay in control.
          </p>
        </div>

        <div className="space-y-3 px-4 py-5 sm:px-7">
          {PERMISSION_ITEMS.map(({ key, title, description, Icon }) => {
            const granted = isGranted(statuses?.[key]);
            return (
              <label
                key={key}
                className={granted
                  ? "flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 transition dark:border-emerald-900 dark:bg-emerald-950/30 sm:gap-4 sm:p-4"
                  : "flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-emerald-700 sm:gap-4 sm:p-4"}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                  {granted ? <Check size={20} /> : <Icon size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {title}
                    <span className={granted ? "text-xs font-medium text-emerald-700 dark:text-emerald-300" : "text-xs font-medium text-slate-500 dark:text-slate-400"}>
                      {readableStatus(statuses?.[key])}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">
                    {description}
                  </span>
                </span>
                {!granted && (
                  <input
                    aria-label={"Request " + title.toLowerCase() + " permission"}
                    checked={Boolean(selected[key])}
                    className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                    disabled={busy}
                    onChange={(event) => setSelected((current) => ({ ...current, [key]: event.target.checked }))}
                    type="checkbox"
                  />
                )}
              </label>
            );
          })}

          <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-3.5 dark:border-sky-900 dark:bg-sky-950/30">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 dark:bg-slate-900 dark:text-sky-300">
              <FileUp size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Files and photos</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">
                When you upload a document or choose a photo, Android opens its secure picker. RevelaCode does not need unrestricted access to all files on your phone.
              </span>
            </span>
          </div>

          <p className="px-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            You can continue without granting these permissions. Only the features that need access will be limited.
          </p>

          {message && (
            <p aria-live="polite" className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {message}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
              disabled={busy || !Object.values(selected).some(Boolean)}
              onClick={enableSelected}
              type="button"
            >
              {busy ? "Waiting for Android…" : "Enable selected access"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={async () => {
                  await openDeviceAppSettings();
                }}
                type="button"
              >
                <Settings size={15} />
                Android settings
              </button>
              <button
                className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={refreshAndUpdate}
                type="button"
              >
                Refresh status
              </button>
            </div>
            <button
              className="min-h-10 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              disabled={busy}
              onClick={continueWithout}
              type="button"
            >
              Continue to RevelaCode
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

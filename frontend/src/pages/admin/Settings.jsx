import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  LockKeyhole,
  Save,
  ShieldCheck,
  AlertTriangle,
  LoaderCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";

import {
  getSystemSettings,
  updateSystemSettings,
} from "../../services/adminSettingsService";

const DEFAULT_SETTINGS = {
  platformName: "Smart Finance",
  supportEmail: "support@smartfinance.com",
  currency: "INR",
  timezone: "Asia/Kolkata",
  twoFactorAuth: false,
  sessionTimeout: "30",
  emailNotifications: true,
  securityAlerts: true,
  maintenanceMode: false,
};

function SettingRow({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="px-5 sm:px-6">{children}</div>
    </section>
  );
}

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50";

const normalizeSettings = (data = {}) => ({
  ...DEFAULT_SETTINGS,
  ...data,
  twoFactorAuth: data.twoFactorAuth ?? DEFAULT_SETTINGS.twoFactorAuth,
  sessionTimeout: String(
    data.sessionTimeout ?? DEFAULT_SETTINGS.sessionTimeout,
  ),
});

const AdminSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setLoadingSettings(true);

      try {
        const data = await getSystemSettings();

        if (cancelled) return;

        const restored = normalizeSettings(data);
        setSettings(restored);
        setSavedSettings(restored);
        setMessage("");
      } catch (error) {
        if (cancelled) return;

        console.error("Unable to load system settings:", error);

        setMessage(
          error.response?.data?.message ||
            "Settings load nahi hui. Backend, admin login aur API route check karo.",
        );
        setMessageType("error");
      } finally {
        if (!cancelled) {
          setLoadingSettings(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...settings,
        sessionTimeout: Number(settings.sessionTimeout),
      };

      const response = await updateSystemSettings(payload);

      // API should return { success: true, data: savedSettings }.
      const returnedSettings = response?.data ?? payload;
      const saved = normalizeSettings(returnedSettings);

      setSettings(saved);
      setSavedSettings(saved);
      setMessage("Settings successfully saved to the database.");
      setMessageType("success");
    } catch (error) {
      console.error("Settings save failed:", error);

      setMessage(
        error.response?.data?.message ||
          "Settings save nahi hui. Network, backend API aur admin permissions check karo.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...savedSettings });
    setMessage("Unsaved changes discarded.");
    setMessageType("success");
  };

  const handleReload = async () => {
    setLoadingSettings(true);
    setMessage("");

    try {
      const data = await getSystemSettings();
      const restored = normalizeSettings(data);

      setSettings(restored);
      setSavedSettings(restored);
      setMessage("Latest settings loaded from the server.");
      setMessageType("success");
    } catch (error) {
      console.error("Settings reload failed:", error);

      setMessage(
        error.response?.data?.message || "Server se settings reload nahi hui.",
      );
      setMessageType("error");
    } finally {
      setLoadingSettings(false);
    }
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  if (loadingSettings) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle size={30} className="animate-spin text-emerald-600" />
        <span className="ml-3 text-sm font-medium text-slate-600">
          Loading system settings...
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="mx-auto w-full max-w-7xl space-y-6 pb-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Administration / Configuration
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage platform preferences, security controls and notification
            options for Smart Finance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleReload}
            disabled={saving || loadingSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Reload
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard changes
          </button>

          <button
            type="submit"
            disabled={saving || !isDirty}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            messageType === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {messageType === "error" ? (
            <XCircle size={19} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          )}

          <p>{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <SectionCard
          icon={Building2}
          title="General Settings"
          description="Configure your platform identity and regional preferences."
        >
          <div className="py-5">
            <label className="block text-sm font-medium text-slate-700">
              Platform Name
              <input
                className={fieldClass}
                value={settings.platformName}
                onChange={(event) =>
                  updateSetting("platformName", event.target.value)
                }
                maxLength={80}
                required
                disabled={saving}
              />
            </label>

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Support Email
              <input
                className={fieldClass}
                type="email"
                value={settings.supportEmail}
                onChange={(event) =>
                  updateSetting("supportEmail", event.target.value)
                }
                required
                disabled={saving}
              />
            </label>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Default Currency
                <select
                  className={fieldClass}
                  value={settings.currency}
                  onChange={(event) =>
                    updateSetting("currency", event.target.value)
                  }
                  disabled={saving}
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Timezone
                <select
                  className={fieldClass}
                  value={settings.timezone}
                  onChange={(event) =>
                    updateSetting("timezone", event.target.value)
                  }
                  disabled={saving}
                >
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">New York</option>
                  <option value="Europe/London">London</option>
                </select>
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={LockKeyhole}
          title="Security & Access"
          description="Manage administrator security preferences."
        >
          <SettingRow
            title="Two-factor authentication"
            description="Enable an additional verification step."
          >
            <Toggle
              label="Two-factor authentication"
              checked={settings.twoFactorAuth}
              onChange={(value) => updateSetting("twoFactorAuth", value)}
              disabled={saving}
            />
          </SettingRow>

          <div className="border-b border-slate-100 py-5">
            <label className="block text-sm font-semibold text-slate-800">
              Session Timeout
              <select
                className={fieldClass}
                value={settings.sessionTimeout}
                onChange={(event) =>
                  updateSetting("sessionTimeout", event.target.value)
                }
                disabled={saving}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="120">2 hours</option>
              </select>
            </label>

            <p className="mt-2 text-xs text-slate-500">
              Actual session enforcement must also be implemented on the
              backend.
            </p>
          </div>

          <div className="my-5 flex gap-3 rounded-xl bg-slate-50 p-4">
            <ShieldCheck className="shrink-0 text-emerald-600" size={21} />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Admin access protection
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Admin APIs must enforce authentication and role verification on
                the server.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Bell}
          title="Notifications"
          description="Choose which notification preferences to enable."
        >
          <SettingRow
            title="Email notifications"
            description="Preference for platform email updates."
          >
            <Toggle
              label="Email notifications"
              checked={settings.emailNotifications}
              onChange={(value) => updateSetting("emailNotifications", value)}
              disabled={saving}
            />
          </SettingRow>

          <SettingRow
            title="Security alerts"
            description="Preference for important security notifications."
          >
            <Toggle
              label="Security alerts"
              checked={settings.securityAlerts}
              onChange={(value) => updateSetting("securityAlerts", value)}
              disabled={saving}
            />
          </SettingRow>
        </SectionCard>

        <SectionCard
          icon={Database}
          title="System Operations"
          description="Review platform operation preferences."
        >
          <SettingRow
            title="Maintenance mode"
            description="Requires backend enforcement to restrict public access."
          >
            <Toggle
              label="Maintenance mode"
              checked={settings.maintenanceMode}
              onChange={(value) => updateSetting("maintenanceMode", value)}
              disabled={saving}
            />
          </SettingRow>

          <div className="my-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle
              className="mt-0.5 shrink-0 text-amber-700"
              size={20}
            />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Backend security note
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Preferences are loaded from and saved through the settings API.
                Two-factor authentication, session timeout and maintenance mode
                need separate server-side enforcement to perform their
                advertised security functions.
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Clock3 size={20} className="text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">
                Configuration status
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isDirty ? "Unsaved changes" : "All changes saved"}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Review your changes before saving
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Save settings to persist them in the database.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !isDirty}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
};

export default AdminSettings;

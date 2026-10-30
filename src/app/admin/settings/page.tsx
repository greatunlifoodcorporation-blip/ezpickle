"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, prepareImage, uploadImage } from "@/lib/client";
import { Logo } from "@/components/logo";
import { BrandProvider } from "@/components/brand";
import {
  Button,
  Card,
  Field,
  PageHeader,
  Skeleton,
  inputClass,
  minutesToLabel,
  selectClass,
  useMutate,
  useResource,
} from "@/components/admin/ui";

type Settings = {
  businessName: string;
  logoUrl: string;
  logoShowName: boolean;
  heroLine1: string;
  heroLine2: string;
  heroAccent: string;
  heroSubtitle: string;
  facilityTitle: string;
  facilityDescription: string;
  courtsTitle: string;
  courtsDescription: string;
  email: string;
  phone: string;
  address: string;
  openingMin: number;
  closingMin: number;
  bookingIntervalMins: number;
  minBookingMins: number;
  maxBookingMins: number;
  maxAdvanceDays: number;
  minCancelNoticeMins: number;
  holdMinutes: number;
  bufferMins: number;
  openPlayHoldMinutes: number;
  waitlistOfferMinutes: number;
  cancellationPolicy: string;
};

const HALF_HOURS = Array.from({ length: 49 }, (_, i) => i * 30);

export default function AdminSettingsPage() {
  const { data, loading } = useResource<{ settings: Settings }>("/api/admin/settings");
  const { run, busy } = useMutate();
  const [form, setForm] = useState<Settings | null>(null);
  const router = useRouter();
  const logoInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    if (data) setForm(data.settings);
  }, [data]);

  if (loading || !form) return <Skeleton className="h-96 w-full" />;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm({ ...form, [key]: value });

  const numberField = (
    label: string,
    key: keyof Settings,
    hint?: string,
    min = 0,
  ) => (
    <Field label={label} hint={hint}>
      <input
        type="number"
        min={min}
        className={inputClass}
        value={form[key] as number}
        onChange={(e) => set(key, Number(e.target.value) as never)}
      />
    </Field>
  );

  /** Saves just the logo straight away so the whole site updates at once. */
  const saveLogo = (logoUrl: string) =>
    run(
      async () => {
        await api("/api/admin/settings", { method: "PATCH", body: { logoUrl } });
        setForm((f) => (f ? { ...f, logoUrl } : f));
      },
      { success: "Logo updated.", onDone: () => router.refresh() },
    );

  const pickLogo = (file: File | null) => {
    setLogoError("");
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setLogoError("Please choose a JPEG, PNG or WebP image.");
      return;
    }
    run(
      async () => {
        const { blob, name } = await prepareImage(file, { maxSide: 600, format: "png" });
        const url = await uploadImage(blob, name);
        await api("/api/admin/settings", { method: "PATCH", body: { logoUrl: url } });
        setForm((f) => (f ? { ...f, logoUrl: url } : f));
      },
      { success: "Logo updated.", onDone: () => router.refresh() },
    );
  };

  const textField = (label: string, key: keyof Settings, hint?: string, long = false) => (
    <Field label={label} hint={hint}>
      {long ? (
        <textarea
          rows={3}
          className={inputClass}
          value={form[key] as string}
          onChange={(e) => set(key, e.target.value as never)}
        />
      ) : (
        <input
          className={inputClass}
          value={form[key] as string}
          onChange={(e) => set(key, e.target.value as never)}
        />
      )}
    </Field>
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Settings"
        description="Business details and the booking rules the whole system reads from."
        actions={
          <Button
            loading={busy}
            onClick={() =>
              run(() => api("/api/admin/settings", { method: "PATCH", body: form }), {
                success: "Settings saved.",
                onDone: () => router.refresh(),
              })
            }
          >
            Save changes
          </Button>
        }
      />

      <div className="space-y-5">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Business details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name">
              <input
                className={inputClass}
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-white/70">Logo</span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 min-w-40 items-center rounded-xl border border-white/10 bg-ink px-4">
                  <BrandProvider
                    brand={{
                      businessName: form.businessName,
                      logoUrl: form.logoUrl,
                      logoShowName: form.logoShowName,
                    }}
                  >
                    <Logo />
                  </BrandProvider>
                </div>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    pickLogo(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoInput.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    pickLogo(e.dataTransfer.files?.[0] ?? null);
                  }}
                  disabled={busy}
                  className={`rounded-xl border border-dashed px-5 py-4 text-sm transition hover:border-white/40 hover:text-white disabled:opacity-50 ${
                    dragging ? "border-pickle-500 bg-white/[0.06] text-white" : "border-white/20 text-white/70"
                  }`}
                >
                  Drag &amp; drop a logo here, or click to upload
                </button>
                {form.logoUrl !== "" && form.logoUrl !== "/logo.png" && (
                  <button
                    type="button"
                    onClick={() => saveLogo("/logo.png")}
                    disabled={busy}
                    className="text-sm text-white/50 underline underline-offset-4 hover:text-white disabled:opacity-50"
                  >
                    Use the default logo
                  </button>
                )}
              </div>
              {logoError && (
                <span role="alert" className="mt-1 block text-xs text-red-400">
                  {logoError}
                </span>
              )}
              <span className="mt-1 block text-xs text-white/40">
                JPEG, PNG or WebP (a PNG with a transparent background looks best). It is applied to the
                whole site as soon as it uploads.
              </span>
              <label className="mt-3 flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={form.logoShowName}
                  onChange={(e) => set("logoShowName", e.target.checked)}
                />
                Show the business name next to the logo (untick if your logo already contains the name,
                then click Save changes)
              </label>
            </div>
            <Field label="Contact email">
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/35">
            Timezone is fixed to Asia/Manila and currency to PHP — both are baked into how bookings
            and money are stored, so they are deliberately not editable here.
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Landing page text
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {textField("Headline, line 1", "heroLine1")}
            {textField("Headline, line 2", "heroLine2")}
            <div className="sm:col-span-2">
              {textField("Headline, green line", "heroAccent", "The last line of the headline, shown in green.")}
            </div>
            <div className="sm:col-span-2">
              {textField("Intro paragraph", "heroSubtitle", undefined, true)}
            </div>
            {textField("Facility section title", "facilityTitle")}
            {textField("Courts section title", "courtsTitle")}
            {textField("Facility section text", "facilityDescription", undefined, true)}
            {textField("Courts section text", "courtsDescription", undefined, true)}
          </div>
          <p className="mt-4 text-xs text-white/35">
            Click <strong>Save changes</strong> (top right) to publish. The numbers under the headline
            (courts, opening hours, price) update by themselves from your courts, hours and pricing.
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Opening hours
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block text-[13px] font-medium text-white/70">Opens</span>
              <select
                className={`${selectClass} w-full`}
                value={form.openingMin}
                onChange={(e) => set("openingMin", Number(e.target.value))}
              >
                {HALF_HOURS.slice(0, 48).map((m) => (
                  <option key={m} value={m}>
                    {minutesToLabel(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block text-[13px] font-medium text-white/70">Closes</span>
              <select
                className={`${selectClass} w-full`}
                value={form.closingMin}
                onChange={(e) => set("closingMin", Number(e.target.value))}
              >
                {HALF_HOURS.slice(1).map((m) => (
                  <option key={m} value={m}>
                    {m === 1440 ? "12:00 AM (midnight)" : minutesToLabel(m)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Booking rules
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {numberField("Slot interval (mins)", "bookingIntervalMins", "Grid granularity.", 15)}
            {numberField("Minimum booking (mins)", "minBookingMins", undefined, 15)}
            {numberField("Maximum booking (mins)", "maxBookingMins", undefined, 30)}
            {numberField("Advance window (days)", "maxAdvanceDays", "How far ahead customers can book.", 1)}
            {numberField("Buffer between bookings (mins)", "bufferMins", "Turnaround gap on each court.")}
            {numberField(
              "Cancellation notice (mins)",
              "minCancelNoticeMins",
              "Free cancellation cut-off.",
            )}
            {numberField("Payment hold (mins)", "holdMinutes", "How long a court slot is held.", 3)}
            {numberField("Open Play hold (mins)", "openPlayHoldMinutes", undefined, 3)}
            {numberField("Waitlist offer window (mins)", "waitlistOfferMinutes", undefined, 5)}
          </div>
          <p className="mt-4 text-xs text-white/35">
            These values drive quotes, the availability grid, the hold sweeper and the customer-facing
            copy. Nothing about pricing lives here — that is in Courts → Pricing rules.
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Cancellation policy
          </h2>
          <textarea
            className={`${inputClass} min-h-28`}
            value={form.cancellationPolicy}
            onChange={(e) => set("cancellationPolicy", e.target.value)}
            aria-label="Cancellation policy"
          />
          <p className="mt-2 text-xs text-white/35">
            Shown to customers before they confirm a cancellation and in booking emails.
          </p>
        </Card>
      </div>
    </div>
  );
}

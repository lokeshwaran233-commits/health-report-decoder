import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Plus,
  Save,
  CheckCircle2,
  X,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Cast until generated DB types include the new `profiles` table.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — ReportRx" },
      {
        name: "description",
        content: "Manage your health profile, conditions, medications, and emergency contact.",
      },
    ],
  }),
  component: ProfilePage,
});

const COMMON_AILMENTS = [
  "Diabetes (Type 2)",
  "Hypertension",
  "Thyroid disorder",
  "Anemia",
  "High Cholesterol",
  "PCOS",
  "Asthma",
  "Kidney disease",
  "Liver disease",
  "Heart disease",
  "Vitamin D deficiency",
  "B12 deficiency",
  "Arthritis",
  "Depression/Anxiety",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const SEX_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

interface ProfileData {
  full_name: string;
  age: string;
  sex: string;
  blood_group: string;
  phone: string;
  ailments: string[];
  medications: string;
  allergies: string;
  emergency_contact: string;
  avatar_url: string;
}

const DEFAULT_PROFILE: ProfileData = {
  full_name: "",
  age: "",
  sex: "",
  blood_group: "",
  phone: "",
  ailments: [],
  medications: "",
  allergies: "",
  emergency_contact: "",
  avatar_url: "",
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customAilment, setCustomAilment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    const load = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          setProfile({
            full_name: data.full_name ?? "",
            age: data.age != null ? String(data.age) : "",
            sex: data.sex ?? "",
            blood_group: data.blood_group ?? "",
            phone: data.phone ?? "",
            ailments: data.ailments ?? [],
            medications: data.medications ?? "",
            allergies: data.allergies ?? "",
            emergency_contact: data.emergency_contact ?? "",
            avatar_url: data.avatar_url ?? "",
          });
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-surface">
        <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  const toggleAilment = (a: string) => {
    setProfile((p) => ({
      ...p,
      ailments: p.ailments.includes(a)
        ? p.ailments.filter((x) => x !== a)
        : [...p.ailments, a],
    }));
  };

  const addCustom = () => {
    const v = customAilment.trim();
    if (!v || profile.ailments.includes(v)) return;
    setProfile((p) => ({ ...p, ailments: [...p.ailments, v] }));
    setCustomAilment("");
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await db.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = db.storage.from("avatars").getPublicUrl(path);
      setAvatarPreview(data.publicUrl);
      setProfile((p) => ({ ...p, avatar_url: data.publicUrl }));
    } catch (err) {
      console.error(err);
      toast.error("Could not upload avatar");
    }
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: profile.full_name || null,
          age: profile.age ? parseInt(profile.age, 10) : null,
          sex: profile.sex || null,
          blood_group: profile.blood_group || null,
          phone: profile.phone || null,
          ailments: profile.ailments,
          medications: profile.medications || null,
          allergies: profile.allergies || null,
          emergency_contact: profile.emergency_contact || null,
          avatar_url: profile.avatar_url || null,
        });
      if (error) throw error;
      setSaved(true);
      toast.success("Profile saved");
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      console.error(e);
      toast.error("Could not save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-brand-surface">
      <div className="mx-auto max-w-2xl px-4 md:px-6 pt-20 pb-24">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-brand-dark tracking-tight">My Profile</h1>
          <p className="mt-1.5 text-sm text-brand-muted">
            This helps Zeno give you more personalised explanations. All data is private to you.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <section className="rounded-card bg-brand-card border border-brand-border p-5 flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-20 w-20 rounded-full bg-brand-teal-light flex items-center justify-center overflow-hidden group"
                aria-label="Upload avatar"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-brand-teal">
                    {(profile.full_name || user.email || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
              <div>
                <p className="text-sm font-medium text-brand-dark">Profile photo</p>
                <p className="text-xs text-brand-muted">Tap to upload (max 3 MB)</p>
              </div>
            </section>

            {/* Basic info */}
            <section className="rounded-card bg-brand-card border border-brand-border p-5 space-y-4">
              <h2 className="text-sm font-semibold text-brand-dark">Basic info</h2>
              <Field label="Full name">
                <input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className={inputCls}
                  placeholder="Your name"
                  maxLength={120}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age">
                  <input
                    type="number"
                    min={0}
                    max={130}
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 32"
                  />
                </Field>
                <Field label="Sex">
                  <select
                    value={profile.sex}
                    onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select…</option>
                    {SEX_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Blood group">
                  <select
                    value={profile.blood_group}
                    onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select…</option>
                    {BLOOD_GROUPS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Phone">
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={inputCls}
                    placeholder="+91 …"
                    maxLength={20}
                  />
                </Field>
              </div>
            </section>

            {/* Health conditions */}
            <section className="rounded-card bg-brand-card border border-brand-border p-5 space-y-4">
              <h2 className="text-sm font-semibold text-brand-dark flex items-center gap-2">
                <Heart className="h-4 w-4 text-brand-coral" /> Health conditions
              </h2>
              <div className="flex flex-wrap gap-2">
                {COMMON_AILMENTS.map((a) => {
                  const on = profile.ailments.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAilment(a)}
                      className={`rounded-pill border text-xs px-3 py-1.5 transition-colors ${
                        on
                          ? "bg-brand-teal border-brand-teal text-white"
                          : "bg-white border-brand-border text-brand-muted hover:border-brand-teal hover:text-brand-dark"
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
                {profile.ailments
                  .filter((a) => !COMMON_AILMENTS.includes(a))
                  .map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-pill bg-brand-teal border border-brand-teal text-white text-xs px-3 py-1.5"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => toggleAilment(a)}
                        aria-label={`Remove ${a}`}
                        className="hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customAilment}
                  onChange={(e) => setCustomAilment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  placeholder="Add another condition…"
                  className={inputCls}
                  maxLength={80}
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="inline-flex items-center gap-1 rounded-btn border border-brand-border bg-white text-sm text-brand-dark px-3 hover:border-brand-teal"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              <Field label="Current medications">
                <textarea
                  value={profile.medications}
                  onChange={(e) => setProfile({ ...profile, medications: e.target.value })}
                  rows={2}
                  className={inputCls}
                  placeholder="Metformin 500mg twice daily, …"
                  maxLength={500}
                />
              </Field>
              <Field label="Allergies">
                <textarea
                  value={profile.allergies}
                  onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                  rows={2}
                  className={inputCls}
                  placeholder="Penicillin, peanuts, …"
                  maxLength={300}
                />
              </Field>
              <Field label="Emergency contact">
                <input
                  value={profile.emergency_contact}
                  onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                  className={inputCls}
                  placeholder="Name and phone number"
                  maxLength={120}
                />
              </Field>
            </section>

            {/* Sticky save */}
            <div className="sticky bottom-4 flex justify-end">
              <button
                type="button"
                onClick={save}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-pill bg-brand-teal text-white text-sm font-medium px-5 py-2.5 shadow-card hover:bg-brand-teal-mid disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saved ? "Saved" : "Save profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-btn border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-hint focus:outline-none focus:border-brand-teal";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-brand-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

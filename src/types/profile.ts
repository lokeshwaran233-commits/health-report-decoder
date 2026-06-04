export const AVATAR_COLORS = [
  { id: "teal", hex: "#0F6E56", name: "Teal" },
  { id: "amber", hex: "#B45309", name: "Amber" },
  { id: "violet", hex: "#6D28D9", name: "Violet" },
  { id: "rose", hex: "#BE185D", name: "Rose" },
  { id: "sky", hex: "#0369A1", name: "Sky" },
  { id: "slate", hex: "#334155", name: "Slate" },
] as const;

export type AvatarColorId = (typeof AVATAR_COLORS)[number]["id"];

export type ProfileRelationship =
  | "self"
  | "father"
  | "mother"
  | "spouse"
  | "partner"
  | "son"
  | "daughter"
  | "sibling"
  | "grandparent"
  | "other";

export type ProfileGender =
  | "male"
  | "female"
  | "other"
  | "prefer_not_to_say";

export interface FamilyProfile {
  id: string;
  userId: string;
  name: string;
  age: number | null;
  gender: ProfileGender | null;
  relationship: ProfileRelationship | null;
  avatarColor: AvatarColorId;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProfileContextType {
  profiles: FamilyProfile[];
  activeProfile: FamilyProfile | null;
  setActiveProfile: (profile: FamilyProfile) => void;
  createProfile: (
    data: Omit<FamilyProfile, "id" | "userId" | "createdAt">,
  ) => Promise<void>;
  updateProfile: (id: string, data: Partial<FamilyProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  loading: boolean;
}

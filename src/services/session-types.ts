import type { PublicState, Role } from "../domain/models";
export type Profile = {
  id: string;
  name: string;
  avatar: string;
  city: string;
  bio: string;
  createdAt: string;
};
export type SessionSnapshot = {
  me: Profile;
  role: Role;
  owner: boolean;
  roomId: string | null;
  state: PublicState;
  demo: boolean;
};
export type Invitation = {
  petName: string;
  city: string;
  inviter: { name: string; avatar: string };
  expiresAt: string;
  status: "available" | "expired" | "joined" | "mine" | "unavailable";
};

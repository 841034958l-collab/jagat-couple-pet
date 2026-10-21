export type ID = string;
export type Timestamp = string;
export type Role = "A" | "B";
export type Status = "pending" | "active" | "completed" | "cancelled";
export type Base = { id: ID; createdAt: Timestamp };
export type User = Base & { role: Role; name: string; avatar?: string };
export type Couple = Base & {
  status: "inviting" | "confirming" | "bound" | "unbound";
  city: string;
  inviteToken: string;
  expiresAt: Timestamp;
  accepted: boolean;
  confirmed: boolean;
  boundAt: Timestamp | null;
};
export type PersonalityProfile = Record<
  | "expression"
  | "exploration"
  | "companionship"
  | "creativity"
  | "independence",
  number
>;
export type Quality = Record<"N" | "E" | "X" | "R" | "L", number>;
export type PetMoodState =
  "happy" | "quiet" | "shy" | "missing" | "sleeping" | "traveling";
export type Pet = Base & {
  name: string;
  species: "恋爱团子";
  xp: number;
  vitality: number;
  bond: number;
  quality: Quality;
  personality: PersonalityProfile;
  mood: PetMoodState;
  position: string;
  birthColor: number;
};
export type PetGrowthEvent = Base & {
  day: number;
  role: Role;
  kind: string;
  label: string;
  xp: number;
  vitality: number;
  bond: number;
  quality: Quality;
  valuationBefore: number;
  valuationAfter: number;
  levelBefore: number;
  levelAfter: number;
  mood: PetMoodState;
  key: string;
};
export type PetNutritionRecord = Base & {
  day: number;
  role: Role;
  food: string;
  preference: string;
};
export type PetValuation = Base & {
  day: number;
  cents: number;
  quality: number;
  reason: string;
};
export type ValuationHistory = PetValuation[];
export type DailyCareRecord = {
  id: ID;
  day: number;
  roles: Role[];
  events: PetGrowthEvent[];
  xp: number;
  vitality: number;
  quality: Quality;
  valuationChange: number;
  status: "complete" | "partial" | "empty";
};
export type CareCalendar = { id: ID; days: DailyCareRecord[] };
export type DailyTask = Base & {
  kind: string;
  title: string;
  xp: number;
  limit: number;
};
export type TaskSubmission = Base & {
  day: number;
  role: Role;
  task: string;
  value: string;
  status: Status;
};
export type StoryChapter = {
  id: ID;
  day: number;
  title: string;
  description: string;
};
export type MapLocation = {
  id: ID;
  name: string;
  icon: string;
  x: number;
  y: number;
  unlock: number;
  clueA: string;
  clueB: string;
};
export type MapAdventure = Base & {
  day: number;
  target: string;
  status: "active" | "completed";
  seen: Role[];
  attempts: number;
};
export type DateMission = Base & {
  day: number;
  title: string;
  description: string;
  completed: Role[];
  status: Status;
};
export type PetDiary = Base & { day: number; text: string; hidden: boolean };
export type FutureLetter = Base & {
  sender: Role;
  recipient: Role;
  unlockDay: number;
  body: string;
  status: "sealed" | "delivered" | "deleted";
};
export type ShopCategory =
  "服装" | "帽子" | "配饰" | "玩具" | "家具" | "主题" | "粮食" | "零食";
export type ShopItem = {
  id: ID;
  name: string;
  category: ShopCategory;
  icon: string;
  currency: "hearts" | "stars";
  price: number;
  description: string;
  consumable?: boolean;
};
export type Wallet = { id: ID; hearts: number; stars: number };
export type InventoryItem = Base & { itemId: ID; quantity: number };
export type PetOutfit = {
  id: ID;
  clothing: string | null;
  hat: string | null;
  accessory: string | null;
};
export type PetHouse = {
  id: ID;
  theme: string;
  wallpaper: string;
  floor: string;
  slots: Record<"bed" | "bowl" | "toy" | "furniture", string>;
  positions: Record<string, { x: number; y: number }>;
};
export type MilestoneReward = {
  id: ID;
  day: number;
  xp: number;
  fundCents: number;
  title: string;
  item: string;
  hearts: number;
};
export type RewardPolicy = {
  id: ID;
  version: string;
  mode: "mock";
  maxCents: number;
  rules: string[];
};
export type RewardEligibility = Base & {
  milestoneId: string;
  eligible: boolean;
  reason: string;
  amountCents: number;
};
export type RewardApplication = Base & {
  milestoneId: string;
  amountCents: number;
  status:
    "submitted_mock" | "reviewing_mock" | "approved_mock" | "rejected_mock";
  kind: "base" | "ugc";
  workUrl?: string;
};
export type FinalVote = Base & {
  role: Role;
  choice: "keep" | "jagat";
  round: number;
};
export type FinalOutcome = Base & {
  round: number;
  kind: "home" | "planet" | "discuss";
  confirmed: boolean;
};
export type ShareArtifact = Base & {
  kind: string;
  format: "3:4" | "9:16" | "wechat";
  hideName: boolean;
  hideLocation: boolean;
  showCouple: boolean;
};
export type AnalyticsEvent = Base & {
  name: string;
  day: number;
  role: Role;
  properties: Record<string, string | number | boolean>;
};
export type Letter = Base & {
  sender: Role;
  body: string;
  reply: string | null;
};
export type Challenge = Base & {
  day: number;
  kind: string;
  answers: Partial<Record<Role, string>>;
  guesses: Partial<Record<Role, string>>;
  status: Status;
};
export type GameState = {
  schema: 3;
  carePlan?: {
    method: "fee_mock" | "member_mock";
    activatedAt: string;
    activatedBy: Role;
  };
  revision: number;
  demoDay: number;
  users: User[];
  couple: Couple | null;
  pet: Pet | null;
  wallet: Wallet;
  inventory: InventoryItem[];
  outfit: PetOutfit;
  house: PetHouse;
  events: PetGrowthEvent[];
  nutrition: PetNutritionRecord[];
  valuations: ValuationHistory;
  submissions: TaskSubmission[];
  diaries: PetDiary[];
  futureLetters: FutureLetter[];
  letters: Letter[];
  adventure: MapAdventure | null;
  dateMission: DateMission | null;
  challenge: Challenge | null;
  needs: Partial<Record<Role, string>>;
  mediation: Partial<Record<Role, string>>;
  claimed: string[];
  applications: RewardApplication[];
  votes: FinalVote[];
  outcomes: FinalOutcome[];
  voteRound: number;
  shareConsent: Role[];
  artifacts: ShareArtifact[];
  analytics: AnalyticsEvent[];
  processed: string[];
  storySeen: number[];
};
export type PublicState = Omit<
  GameState,
  "votes" | "adventure" | "challenge"
> & {
  votes: Record<Role, boolean>;
  adventure: (Omit<MapAdventure, "target"> & { clue: string | null }) | null;
  challenge:
    | (Omit<Challenge, "answers" | "guesses"> & {
        mine: string | null;
        myGuess: string | null;
        otherSubmitted: boolean;
        result: {
          answers: Partial<Record<Role, string>>;
          matches: number;
        } | null;
      })
    | null;
};
export type Command = {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
};

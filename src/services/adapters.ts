import type {
  Command,
  PublicState,
  Role,
  RewardEligibility,
  RewardApplication,
  ShareArtifact,
} from "../domain/models";
/** Production implementations must authenticate identity on the server, ignore client role/day,
 * enforce idempotency and resource ownership transactionally, and redact private fields. */
export interface GameAPI {
  get(role: Role): Promise<PublicState>;
  execute(role: Role, command: Command): Promise<PublicState>;
  reset(): Promise<void>;
}
export interface MapAdapter {
  openLocation(locationId: string): Promise<void>;
  getLocationPermission(): Promise<"not-requested" | "granted" | "denied">;
}
export interface PaymentAdapter {
  purchase(
    productId: string,
    idempotencyKey: string,
  ): Promise<{ status: "pending" | "mock"; receiptId: string }>;
}
export interface RewardAdapter {
  eligibility(milestoneId: string): Promise<RewardEligibility>;
  apply(id: string, key: string): Promise<RewardApplication>;
}
export interface AdAdapter {
  showRewardedAd(
    placement: string,
  ): Promise<{ completed: boolean; mock: boolean }>;
  showNativeAd(placement: string): Promise<{ label: string; mock: boolean }>;
}
export interface JagatBridge {
  authenticate(): Promise<{ sessionId: string }>;
  share(artifact: ShareArtifact): Promise<{ status: "opened" | "cancelled" }>;
  close(): void;
}
export class HttpGameAPI implements GameAPI {
  constructor(private baseURL: string) {
    if (!/^https:\/\//.test(baseURL))
      throw new Error("正式 API 必须使用 HTTPS");
  }
  private async request(path: string, body?: unknown) {
    const r = await fetch(this.baseURL + path, {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`服务请求失败 (${r.status})`);
    return r.json();
  }
  get(_role: Role) {
    return this.request("/game") as Promise<PublicState>;
  }
  execute(_role: Role, command: Command) {
    return this.request("/commands", command) as Promise<PublicState>;
  }
  async reset() {
    throw new Error("正式环境禁止客户端重置游戏");
  }
}
export const mockAds: AdAdapter = {
  async showRewardedAd(placement) {
    if (["vote", "letters", "ending"].includes(placement))
      throw new Error("私密节点禁止广告");
    await new Promise((r) => setTimeout(r, 1300));
    return { completed: true, mock: true };
  },
  async showNativeAd() {
    return { label: "模拟原生广告 · 仅演示展示位", mock: true };
  },
};
export const mockMap: MapAdapter = {
  async openLocation() {
    /* virtual map; no GPS */
  },
  async getLocationPermission() {
    return "not-requested";
  },
};

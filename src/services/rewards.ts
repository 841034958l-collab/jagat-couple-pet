import type { GameAPI, RewardAdapter } from "./adapters";
import type { Role, RewardPolicy } from "../domain/models";
import { milestones } from "../domain/config";
import { uid } from "../domain/engine";
export const mockRewardPolicy: RewardPolicy = {
  id: "demo-policy-v1",
  version: "1.0",
  mode: "mock",
  maxCents: 9900,
  rules: [
    "仅演示申请与审核，不产生真实现金资格或转账",
    "基础奖励不要求广告、付费、外部发帖或邀请新人",
    "每个里程碑一次申请，D99需完成并确认双方一致结局",
    "UGC活动独立审核，不保证名额或金额",
  ],
};
export class MockRewardService implements RewardAdapter {
  constructor(
    private api: GameAPI,
    private role: Role,
  ) {}
  async eligibility(milestoneId: string) {
    const s = await this.api.get(this.role);
    const m = milestones.find((m) => m.id === milestoneId);
    return {
      id: uid(),
      createdAt: new Date().toISOString(),
      milestoneId,
      eligible:
        !!m &&
        s.claimed.includes(milestoneId) &&
        !s.applications.some(
          (a) => a.milestoneId === milestoneId && a.kind === "base",
        ),
      reason: "Demo 资格，正式资格需独立 RewardPolicy 和服务端审核",
      amountCents: m?.fundCents ?? 0,
    };
  }
  async apply(id: string, key: string) {
    const s = await this.api.execute(this.role, {
      id: key,
      type: "reward_apply",
      payload: { id },
    });
    return s.applications.find(
      (a) => a.milestoneId === id && a.kind === "base",
    )!;
  }
}

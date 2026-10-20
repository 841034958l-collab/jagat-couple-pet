import type { Command } from "../domain/models";
import type { SessionSnapshot, Invitation, Profile } from "./session-types";
export class SharedAPI {
  private async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    let r: Response;
    try {
      r = await fetch("/api" + path, {
        method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error("无法连接共享服务，请检查网络后重试。");
    }
    const type = r.headers.get("content-type") || "";
    if (!type.includes("application/json"))
      throw new Error(
        "当前站点未连接共享后端。请部署前后端服务，GitHub Pages不能单独运行双人房间。",
      );
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `请求失败 (${r.status})`);
    return data as T;
  }
  session() {
    return this.request<SessionSnapshot>("/session");
  }
  profile(p: Pick<Profile, "name" | "avatar" | "city" | "bio">) {
    return this.request<SessionSnapshot>("/profile", "PATCH", p);
  }
  create(payload: Record<string, unknown>) {
    return this.request<SessionSnapshot>("/rooms", "POST", payload);
  }
  invitation(token: string) {
    return this.request<Invitation>(`/invites/${encodeURIComponent(token)}`);
  }
  accept(token: string) {
    return this.request<SessionSnapshot>(
      `/invites/${encodeURIComponent(token)}/accept`,
      "POST",
      {},
    );
  }
  renew() {
    return this.request<SessionSnapshot>("/rooms/invite", "POST", {});
  }
  execute(command: Command) {
    return this.request<SessionSnapshot>("/commands", "POST", command);
  }
}
export const sharedAPI = new SharedAPI();
let initialRequest: Promise<SessionSnapshot> | null = null;
export function initializeSession() {
  if (!initialRequest)
    initialRequest = sharedAPI.session().catch((e) => {
      initialRequest = null;
      throw e;
    });
  return initialRequest;
}

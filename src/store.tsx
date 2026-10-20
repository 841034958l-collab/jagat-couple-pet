import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { PublicState, Role } from "./domain/models";
import type {
  Profile,
  SessionSnapshot,
  Invitation,
} from "./services/session-types";
import { sharedAPI, initializeSession } from "./services/shared";
import { uid } from "./domain/engine";
type Context = {
  state: PublicState;
  role: Role;
  me: Profile;
  owner: boolean;
  demo: boolean;
  roomId: string | null;
  busy: boolean;
  online: boolean;
  notify: (s: string) => void;
  refresh: () => Promise<void>;
  run: (
    type: string,
    payload?: Record<string, unknown>,
    message?: string,
  ) => Promise<PublicState | null>;
  saveProfile: (
    p: Pick<Profile, "name" | "avatar" | "city" | "bio">,
  ) => Promise<boolean>;
  acceptInvite: (token: string) => Promise<boolean>;
  getInvite: (token: string) => Promise<Invitation>;
  renewInvite: () => Promise<string | null>;
  reset: () => Promise<void>;
};
const Store = createContext<Context | null>(null);
export function useGame() {
  const c = useContext(Store);
  if (!c) throw new Error("Game provider missing");
  return c;
}
export function GameProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const lock = useRef(false);
  const generation = useRef(0);
  const notify = (s: string) => setToast(s);
  const current = useRef<SessionSnapshot | null>(null);
  function apply(next: SessionSnapshot) {
    const prev = current.current;
    if (
      prev?.roomId === next.roomId &&
      prev &&
      prev.state.revision > next.state.revision
    )
      return;
    current.current = next;
    setSnapshot(next);
    setOnline(true);
  }
  async function refresh() {
    if (lock.current) return;
    const started = generation.current;
    try {
      const next = await sharedAPI.session();
      if (started === generation.current) apply(next);
    } catch {
      if (started === generation.current) setOnline(false);
    }
  }
  useEffect(() => {
    let alive = true;
    initializeSession()
      .then((s) => {
        if (alive) apply(s);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!snapshot) return;
    const timer = setInterval(() => {
      if (!lock.current && document.visibilityState === "visible")
        void refresh();
    }, 2000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [!!snapshot]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  async function mutate(fn: () => Promise<SessionSnapshot>, message?: string) {
    if (lock.current) return null;
    lock.current = true;
    generation.current++;
    setBusy(true);
    try {
      const next = await fn();
      apply(next);
      if (message) notify(message);
      return next;
    } catch (e) {
      notify((e as Error).message);
      return null;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function run(
    type: string,
    payload: Record<string, unknown> = {},
    message?: string,
  ) {
    const result = await mutate(
      () =>
        type === "adopt"
          ? sharedAPI.create(payload)
          : sharedAPI.execute({ id: uid(), type, payload }),
      message,
    );
    return result?.state ?? null;
  }
  async function saveProfile(
    p: Pick<Profile, "name" | "avatar" | "city" | "bio">,
  ) {
    return !!(await mutate(() => sharedAPI.profile(p), "个人资料已保存"));
  }
  async function acceptInvite(token: string) {
    return !!(await mutate(
      () => sharedAPI.accept(token),
      "房间成立！现在可以一起养宠啦",
    ));
  }
  async function renewInvite() {
    const s = await mutate(() => sharedAPI.renew());
    return s?.state.couple?.inviteToken ?? null;
  }
  async function reset() {
    notify(
      "共享房间不能单方面重置。需要结束共同养宠时，请前往双人房间解除绑定。",
    );
  }
  if (error)
    return (
      <div className="fatal">
        <h1>共享服务暂未连接</h1>
        <p>{error}</p>
        <p className="description">
          双人邀请需要共同的服务端。请使用完整部署站点，或在开发环境启动 npm run
          dev。
        </p>
        <button onClick={() => location.reload()}>重新连接</button>
      </div>
    );
  if (!snapshot)
    return (
      <div className="loading">
        <div className="loading-orb" />
        <p>正在连接你的小世界…</p>
      </div>
    );
  return (
    <Store.Provider
      value={{
        state: snapshot.state,
        role: snapshot.role,
        me: snapshot.me,
        owner: snapshot.owner,
        demo: snapshot.demo,
        roomId: snapshot.roomId,
        busy,
        online,
        notify,
        refresh,
        run,
        saveProfile,
        acceptInvite,
        getInvite: (t) => sharedAPI.invitation(t),
        renewInvite,
        reset,
      }}
    >
      {children}
      {!online && (
        <div className="connection-warning" role="status">
          连接中断，正在重连；资料和房间进度保留在服务端。
        </div>
      )}
      {busy && (
        <div className="saving" role="status">
          正在保存…
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Store.Provider>
  );
}

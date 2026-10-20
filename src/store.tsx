import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { PublicState, Role } from "./domain/models";
import { MockGameAPI, STORAGE_KEY } from "./services/mock";
import { uid } from "./domain/engine";
import type { GameAPI } from "./services/adapters";
type Context = {
  state: PublicState;
  role: Role;
  setRole: (r: Role) => void;
  run: (
    type: string,
    payload?: Record<string, unknown>,
    message?: string,
  ) => Promise<PublicState | null>;
  busy: boolean;
  notify: (s: string) => void;
  reset: () => Promise<void>;
};
const Store = createContext<Context | null>(null);
export const useGame = () => {
  const c = useContext(Store);
  if (!c) throw new Error("Game provider missing");
  return c;
};
export function GameProvider({ children }: { children: ReactNode }) {
  const api = useRef<GameAPI | null>(null);
  const [state, setState] = useState<PublicState | null>(null);
  const [role, setRoleValue] = useState<Role>("A");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const notify = (text: string) => setToast(text);
  useEffect(() => {
    try {
      api.current = new MockGameAPI();
      api.current
        .get(role)
        .then(setState)
        .catch((e) => setError(e.message));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  async function setRole(next: Role) {
    if (!api.current || lock.current || next === role) return;
    lock.current = true;
    setBusy(true);
    try {
      const snapshot = await api.current.get(next);
      // Commit identity and its redacted snapshot together; never render the prior role's projection.
      setState(snapshot);
      setRoleValue(next);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    const handler = () => {
      try {
        api.current = new MockGameAPI();
        api.current.get(role).then(setState);
      } catch (e) {
        setError((e as Error).message);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [role]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  async function run(
    type: string,
    payload: Record<string, unknown> = {},
    message?: string,
  ) {
    if (lock.current || !api.current) return null;
    lock.current = true;
    setBusy(true);
    try {
      const result = await api.current.execute(role, {
        id: uid(),
        type,
        payload,
      });
      setState(result);
      if (message) notify(message);
      return result;
    } catch (e) {
      notify((e as Error).message);
      return null;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      api.current = new MockGameAPI();
      setState(await api.current.get("A"));
      setRoleValue("A");
      setError("");
      notify("Demo 已重置；旧版 MVP 存档未删除。");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (error)
    return (
      <div className="fatal">
        <h1>存档暂时无法读取</h1>
        <p>{error}</p>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(
              new Blob([localStorage.getItem(STORAGE_KEY) || ""], {
                type: "application/json",
              }),
            );
            a.download = "jagat-backup.json";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          导出原始备份
        </button>
        <button
          onClick={() => {
            if (confirm("确认清除本机 V3 演示数据？此操作不可恢复。"))
              void reset();
          }}
        >
          重置 Demo
        </button>
      </div>
    );
  if (!state)
    return (
      <div className="loading">
        <div className="loading-orb" />
        <p>团子正在布置我们的小世界…</p>
      </div>
    );
  return (
    <Store.Provider value={{ state, role, setRole, run, busy, notify, reset }}>
      {children}
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

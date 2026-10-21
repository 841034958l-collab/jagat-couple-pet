import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  House,
  Compass,
  Heart,
  CalendarDays,
  ChartNoAxesCombined,
  ShoppingBag,
  Gift,
  BookOpen,
  Sparkles,
  Settings2,
  Users,
} from "lucide-react";
import { GameProvider, useGame } from "./store";
import { Home } from "./pages/Home";
import { Couple } from "./pages/Couple";
import { Valuation } from "./pages/Valuation";
import { Calendar } from "./pages/Calendar";
import { Empty } from "./components/UI";
import { Map } from "./pages/Map";
import { Interact } from "./pages/Interact";
import { Shop } from "./pages/Shop";
import { House as HousePage } from "./pages/House";
import { Rewards } from "./pages/Rewards";
import { Share } from "./pages/Share";
import { Story } from "./pages/Story";
import { Ending } from "./pages/Ending";
import { Demo } from "./pages/Demo";
import { Profile } from "./pages/Profile";
import { Celebration } from "./components/Celebration";
import { Tasks } from "./pages/Tasks";
import { CareStory, Charity } from "./pages/CareStory";
import { Identity } from "./pages/Identity";
import { AdoptionStory } from "./components/AdoptionStory";
import "./v3.css";
import "./v4.css";
const nav = [
  ["home", "首页", House],
  ["tasks", "任务", CalendarDays],
  ["map", "情侣地图", Compass],
  ["interact", "心动互动", Heart],
  ["valuation", "照护成长报告", ChartNoAxesCombined],
  ["calendar", "养宠日历", CalendarDays],
  ["shop", "商店", ShoppingBag],
  ["rewards", "成长奖励", Gift],
  ["story", "99天故事", BookOpen],
  ["share", "分享纪念", Sparkles],
  ["couple", "双人房间", Users],
  ["profile", "我的", Users],
  ["demo", "更多功能", Settings2],
] as const;
function App() {
  const [storyOpen, setStoryOpen] = useState(() => {
    try {
      return localStorage.getItem("jagat-care-story-v4") !== "seen";
    } catch {
      return true;
    }
  });
  function closeStory() {
    setStoryOpen(false);
    try {
      localStorage.setItem("jagat-care-story-v4", "seen");
    } catch {
      /* browser privacy mode: session-only dismiss */
    }
  }
  const [page, setPage] = useState(location.hash.slice(1) || "home");
  const { state: s, role, me } = useGame();
  function go(p: string) {
    location.hash = p;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  useEffect(() => {
    const fn = () => setPage(location.hash.slice(1) || "home");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  const allowed = [
    "home",
    "couple",
    "demo",
    "story",
    "share",
    "profile",
    "shelter",
    "charity",
  ];
  const locked = s.couple?.status !== "bound" && !allowed.includes(page);
  return (
    <div className="app">
      <Celebration />
      {storyOpen && (
        <AdoptionStory
          onClose={closeStory}
          onStart={() => {
            closeStory();
            go("shelter");
          }}
        />
      )}
      <aside className="sidebar">
        <a className="brand" onClick={() => go("home")}>
          <span>j</span>jagat<i>●</i>
        </a>
        <div className="brand-caption">99天养宠计划</div>
        <span className="nav-caption">OUR LITTLE WORLD</span>
        <nav>
          {nav
            .filter((n) => ["home", "tasks", "shop", "profile"].includes(n[0]))
            .map(([id, label, I]) => (
              <button
                className={`nav-item ${page === id ? "active" : ""}`}
                key={id}
                onClick={() => go(id)}
              >
                <I size={19} />
                <span>{label}</span>
                {id === "map" && s.adventure?.status === "active" && <i />}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <span>👩🏻 ♡ 👦🏻</span>
          <b>两个人，一只恋爱团子。</b>
          <p>把陪伴，养成独一份的爱。</p>
          <small>JAGAT · 99 DAYS OF LOVE</small>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumbs">
            我们的世界 <span>/</span>
            {nav.find((n) => n[0] === page)?.[1] || "我们的小窝"}
          </div>
          <div className="header-right">
            <button className="story-replay" onClick={() => setStoryOpen(true)}>
              ▷ 照护站故事
            </button>
            <span className="demo-label">V4 · 模拟体验</span>
            <button
              className="my-profile-chip"
              onClick={() => go("profile")}
              aria-label="我的个人资料"
            >
              <span>{me.avatar}</span>
              <b>{me.name}</b>
            </button>
          </div>
        </header>
        <div className="content">
          {locked ? (
            <Empty
              icon="💌"
              title="先一起领养，再开始冒险"
              text="一人创建房间并邀请，对方用自己的设备接受后开始共同养宠。"
            >
              <button
                className="primary"
                onClick={() => go(s.couple ? "couple" : "home")}
              >
                去共同领养
              </button>
            </Empty>
          ) : page === "home" ? (
            <Home go={go} />
          ) : page === "tasks" ? (
            <Tasks go={go} />
          ) : page === "shelter" ? (
            <CareStory go={go} replay={() => setStoryOpen(true)} />
          ) : page === "charity" ? (
            <Charity />
          ) : page === "identity" ? (
            <Identity go={go} />
          ) : page === "profile" ? (
            <Profile go={go} />
          ) : page === "couple" ? (
            <Couple go={go} />
          ) : page === "valuation" ? (
            <Valuation />
          ) : page === "calendar" ? (
            <Calendar />
          ) : page === "map" ? (
            <Map go={go} />
          ) : page === "interact" ? (
            <Interact />
          ) : page === "shop" ? (
            <Shop go={go} />
          ) : page === "house" ? (
            <HousePage />
          ) : page === "rewards" ? (
            <Rewards />
          ) : page === "share" ? (
            <Share />
          ) : page === "story" ? (
            <Story go={go} />
          ) : page === "ending" ? (
            <Ending key={role} go={go} />
          ) : page === "demo" ? (
            <Demo go={go} />
          ) : (
            <Empty title="这一页还没有故事" text="请使用导航返回小窝。">
              <button className="primary" onClick={() => go("home")}>
                回小窝
              </button>
            </Empty>
          )}
          <footer className="page-footer">
            <span>jagat ♡ 把陪伴，变成小小冒险。</span>
            <span>SHARED PET · NO REAL PAYMENTS</span>
          </footer>
        </div>
      </main>
      <nav className="mobile-nav">
        {nav
          .filter((n) => ["home", "tasks", "shop", "profile"].includes(n[0]))
          .map(([id, label, I]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => go(id)}
            >
              <I size={21} />
              <span>{label}</span>
            </button>
          ))}
      </nav>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);

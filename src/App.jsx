import { useEffect, useState } from "react";
import Icon from "./components/Icon.jsx";
import AnswerSheet from "./components/AnswerSheet.jsx";
import MarkPage from "./pages/MarkPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import GuidePage from "./pages/GuidePage.jsx";
import ImpactPage from "./pages/ImpactPage.jsx";
import { load, save } from "./lib/storage.js";
import { SAMPLE_GUIDE } from "./lib/sampleGuide.js";
import { checkServer } from "./lib/api.js";

const TABS = [
  { id: "mark", label: "Mark", icon: "camera" },
  { id: "results", label: "Results", icon: "results" },
  { id: "guide", label: "Guide", icon: "guide" },
  { id: "impact", label: "Impact", icon: "impact" },
];

function currentTab() {
  const id = window.location.hash.replace("#", "");
  return TABS.some((t) => t.id === id) ? id : "mark";
}

export default function App() {
  const [tab, setTab] = useState(currentTab);
  const [guide, setGuide] = useState(() => load("guide", SAMPLE_GUIDE));
  const [results, setResults] = useState(() => load("results", []));
  const [server, setServer] = useState({ checking: true });

  useEffect(() => {
    const onHash = () => setTab(currentTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    save("guide", guide);
  }, [guide]);
  useEffect(() => {
    save("results", results);
  }, [results]);

  useEffect(() => {
    checkServer().then((s) => setServer({ checking: false, ...s }));
  }, []);

  const go = (id) => {
    window.location.hash = id;
    window.scrollTo(0, 0);
  };

  const addResult = (result) => setResults((list) => [result, ...list]);

  return (
    <>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Icon name="check" size={18} />
            </span>
            Snap &amp; Mark
          </div>
          <ServerBadge server={server} />
        </header>

        <main className="page">
          {tab === "mark" && <MarkPage guide={guide} onSaved={addResult} goTo={go} server={server} />}
          {tab === "results" && <ResultsPage results={results} setResults={setResults} guide={guide} goTo={go} />}
          {tab === "guide" && <GuidePage guide={guide} setGuide={setGuide} />}
          {tab === "impact" && <ImpactPage results={results} />}
        </main>

        <nav className="tabbar" aria-label="Main">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={`tab ${tab === t.id ? "active" : ""}`}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
      </div>
      <AnswerSheet guide={guide} />
    </>
  );
}

function ServerBadge({ server }) {
  if (server.checking) return <span className="status">Checking…</span>;
  if (!server.reachable) return <span className="status bad">Offline</span>;
  if (!server.keyConfigured) return <span className="status warn">AI not set up</span>;
  return <span className="status good">AI ready</span>;
}

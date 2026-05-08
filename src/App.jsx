
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Gamepad2,
  Home,
  Menu,
  Plus,
  Search,
  Settings,
  Shield,
  Trophy,
  User,
  Users,
  X
} from "lucide-react";
import "./style.css";

const layouts = [
  ["neon", "1. Neon Command", "Futuristic · Bold · Neon"],
  ["deck", "2. Steam Deck", "Clean · Console · Focused"],
  ["arcade", "3. Cyber Arcade", "Vibrant · Playful · Retro"],
  ["cozy", "4. Cozy Quest", "Warm · Friendly · Adventure"],
  ["lan", "5. LAN Party", "Retro · Bold · Hardware"],
  ["minimal", "6. Minimal Pro", "Minimal · Clean · Efficient"],
  ["grid", "7. Grid Command", "Data · Tactical · Structured"],
  ["carousel", "8. Carousel Focus", "Visual · Immersive · Media First"],
  ["sidenav", "9. Side Nav Command", "Command Center · Dashboard"],
  ["immersion", "10. Full Immersion", "Cinematic · Fullscreen · Story Driven"]
];

const squad = [
  { name: "Kevin", status: "Playing", avatar: "K", game: "Helldivers 2" },
  { name: "Tom", status: "In Game", avatar: "T", game: "Deep Rock" },
  { name: "Sven", status: "In Voice", avatar: "S", game: "Discord" },
  { name: "Shane", status: "Idle", avatar: "S", game: "SquadUp" },
  { name: "Lars", status: "Online", avatar: "L", game: "Steam" }
];

const picks = [
  { rank: 1, name: "HELLDIVERS™ 2", match: "93% Match", ready: "93% READY", img: "heroA" },
  { rank: 2, name: "DEEP ROCK GALACTIC", match: "88% Match", ready: "88% READY", img: "heroB" },
  { rank: 3, name: "VALHEIM", match: "82% Match", ready: "82% READY", img: "heroC" }
];

export default function App() {
  const [layout, setLayout] = useState("neon");
  const [toast, setToast] = useState("");
  const Current = {
    neon: NeonCommand,
    deck: SteamDeck,
    arcade: CyberArcade,
    cozy: CozyQuest,
    lan: LanParty,
    minimal: MinimalPro,
    grid: GridCommand,
    carousel: CarouselFocus,
    sidenav: SideNavCommand,
    immersion: FullImmersion
  }[layout];

  function notify(message) {
    setToast(message);
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => setToast(""), 1600);
  }

  return (
    <div className="stage">
      <div className="layoutSwitcher">
        {layouts.map(([id, title]) => (
          <button key={id} className={layout === id ? "active" : ""} onClick={() => setLayout(id)}>{title.replace(/^\d+\.\s/, "")}</button>
        ))}
      </div>
      <div className={`phone ${layout}`}>
        <Current notify={notify} setLayout={setLayout} />
      </div>
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

function SquadRow({ compact = false }) {
  return (
    <div className={compact ? "squadRow compact" : "squadRow"}>
      {squad.map(member => (
        <div className="squadMember" key={member.name}>
          <div className="avatar">{member.avatar}</div>
          <strong>{member.name}</strong>
          <span>{member.status}</span>
        </div>
      ))}
    </div>
  );
}

function PickList({ variant = "default", notify }) {
  return (
    <div className={`pickList ${variant}`}>
      {picks.map(pick => (
        <button key={pick.name} className="pick" onClick={() => notify(`${pick.name} ingepland`)}>
          <b>{pick.rank}</b>
          <div className={`thumb ${pick.img}`}></div>
          <div>
            <strong>{pick.name}</strong>
            <span>{pick.match}</span>
          </div>
          <em>{pick.ready}</em>
        </button>
      ))}
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="bottomNav">
      <button><Home size={17}/><span>Home</span></button>
      <button><Search size={17}/><span>Discover</span></button>
      <button><Users size={17}/><span>Squad</span></button>
      <button><CalendarDays size={17}/><span>Plan</span></button>
      <button><User size={17}/><span>Profile</span></button>
    </nav>
  );
}

function TopBar({ title = "SQUADUP.GG", centered = false }) {
  return (
    <header className={centered ? "topBar centered" : "topBar"}>
      <strong>{title}</strong>
      <div>
        <Bell size={16}/>
        <User size={16}/>
      </div>
    </header>
  );
}

function NeonCommand({ notify }) {
  return (
    <main className="screen neonScreen">
      <TopBar />
      <section className="squadOnline">
        <p>SQUAD ONLINE</p>
        <SquadRow />
      </section>
      <section className="neonQuestion">
        <div>
          <span>WHAT WE PLAYING</span>
          <h1>TONIGHT?</h1>
          <p>Get smart picks based on who's online</p>
        </div>
        <button onClick={() => notify("Smart match gestart")}><ChevronRight /></button>
      </section>
      <h3 className="label">TONIGHT'S PICKS</h3>
      <PickList variant="neonPicks" notify={notify}/>
      <BottomNav />
    </main>
  );
}

function SteamDeck({ notify }) {
  return (
    <main className="deckShell">
      <aside className="deckRail">
        <button className="active"><Home size={16}/><span>Home</span></button>
        <button><Search size={16}/><span>Discover</span></button>
        <button><Users size={16}/><span>Squad</span></button>
        <button><CalendarDays size={16}/><span>Plan</span></button>
        <button><User size={16}/><span>Profile</span></button>
        <button><Settings size={16}/><span>Settings</span></button>
      </aside>
      <section className="deckMain">
        <TopBar />
        <h2>Good evening, Kevin</h2>
        <p className="muted">Squad Online</p>
        <SquadRow compact />
        <div className="continueCard">
          <div className="thumb heroB"></div>
          <div>
            <span>Continue Playing Together</span>
            <h3>DEEP ROCK GALACTIC</h3>
            <p>3 friends playing</p>
          </div>
          <button onClick={() => notify("Joined Deep Rock")}>JOIN</button>
        </div>
        <h3>Play Tonight</h3>
        <PickList variant="deckPicks" notify={notify}/>
      </section>
    </main>
  );
}

function CyberArcade({ notify }) {
  return (
    <main className="screen arcadeScreen">
      <TopBar title="☠ SQUADUP.GG" />
      <section className="arcadeStatus">
        <p>SQUAD STATUS</p>
        <SquadRow />
      </section>
      <section className="arcadeStart">
        <h1>WHAT WE PLAYING<br/>TONIGHT?</h1>
        <p>PRESS START</p>
        <Gamepad2 size={46}/>
      </section>
      <h3 className="arcadeLabel">TOP PICKS</h3>
      <PickList variant="arcadePicks" notify={notify}/>
      <BottomNav />
    </main>
  );
}

function CozyQuest({ notify }) {
  return (
    <main className="screen cozyScreen">
      <header className="cozyTop"><Menu size={18}/><strong>SquadUp.gg</strong><User size={18}/></header>
      <section className="cozyPaper">
        <span>Your Squad</span>
        <SquadRow />
      </section>
      <section className="cozyHero">
        <h1>What shall we play tonight?</h1>
        <p>We've got some great ideas</p>
        <button onClick={() => notify("Adventure board geopend")}><ChevronRight /></button>
      </section>
      <h3>Tonight's Picks</h3>
      <PickList variant="cozyPicks" notify={notify}/>
      <BottomNav />
    </main>
  );
}

function LanParty({ notify }) {
  return (
    <main className="screen lanScreen">
      <TopBar title="☢ SQUADUP.GG" />
      <section className="lanPanel">
        <p>SQUAD ONLINE</p>
        <SquadRow />
      </section>
      <section className="lanDisplay">
        <h1>WHAT ARE WE<br/>PLAYING TONIGHT?</h1>
        <p>&gt; FIND THE PERFECT GAME</p>
      </section>
      <h3>TONIGHT'S PICKS</h3>
      <PickList variant="lanPicks" notify={notify}/>
      <BottomNav />
    </main>
  );
}

function MinimalPro({ notify }) {
  return (
    <main className="minimalShell">
      <aside className="minimalRail">
        <Home size={16}/><Search size={16}/><Users size={16}/><CalendarDays size={16}/><User size={16}/><Settings size={16}/>
      </aside>
      <section className="minimalMain">
        <TopBar />
        <p>Squad Online</p>
        <SquadRow compact />
        <section className="minimalQuestion">
          <div>
            <h1>What should we<br/>play tonight?</h1>
            <p>Smart picks for your squad</p>
          </div>
          <button onClick={() => notify("Match gevonden")}><ChevronRight /></button>
        </section>
        <h3>Top Picks</h3>
        <PickList variant="minimalPicks" notify={notify}/>
      </section>
    </main>
  );
}

function GridCommand({ notify }) {
  return (
    <main className="screen gridScreen">
      <TopBar />
      <section className="gridStatus">
        <div>
          <h3>SQUAD STATUS</h3>
          {squad.map(m => <p key={m.name}><b>{m.name}</b><span>{m.status}</span></p>)}
        </div>
        <div>
          <h3>CURRENTLY PLAYING</h3>
          <h2>HELLDIVERS™ 2</h2>
          <p>Kevin, Tom</p>
          <button onClick={() => notify("Joining session")}>JOIN</button>
        </div>
      </section>
      <section className="mission">
        <h3>MISSION CONTROL</h3>
        <p>What should we play tonight?</p>
        <button onClick={() => notify("Match analysis gestart")}>FIND MATCH</button>
      </section>
      <h3>TOP MATCHES</h3>
      <PickList variant="gridPicks" notify={notify}/>
    </main>
  );
}

function CarouselFocus({ notify }) {
  return (
    <main className="screen carouselScreen">
      <TopBar />
      <p>Squad Online</p>
      <SquadRow compact />
      <section className="bigCarousel">
        {picks.map((pick, i) => (
          <article key={pick.name} className={i === 0 ? "mainSlide" : ""}>
            <div className={`thumb ${pick.img}`}></div>
            <h1>{pick.name}</h1>
            <p>{pick.match} · 4 Ready</p>
            <button onClick={() => notify(`${pick.name} joined`)}>JOIN</button>
          </article>
        ))}
      </section>
      <h3>More Great Picks</h3>
      <div className="miniStrip">
        {picks.map(p => <div key={p.name} className={`thumb ${p.img}`}></div>)}
      </div>
      <BottomNav />
    </main>
  );
}

function SideNavCommand({ notify }) {
  return (
    <main className="sideCommand">
      <aside className="sideNav">
        <strong>SquadUp</strong>
        <button className="active">Dashboard</button>
        <button>Discover</button>
        <button>Squad</button>
        <button>Plan</button>
        <button>Games</button>
        <button>Activity</button>
        <button>Profile</button>
        <button>Settings</button>
      </aside>
      <section className="sideMain">
        <TopBar title="Dashboard" />
        <section className="sideCard">
          <h3>Squad Online</h3>
          <SquadRow compact />
        </section>
        <section className="sideQuestion">
          <div>
            <h2>What should we play tonight?</h2>
            <p>Get smart recommendations.</p>
          </div>
          <button onClick={() => notify("Recommendations geopend")}><ChevronRight /></button>
        </section>
        <h3>Tonight's Top Matches</h3>
        <PickList variant="sidePicks" notify={notify}/>
      </section>
    </main>
  );
}

function FullImmersion({ notify }) {
  return (
    <main className="immersionScreen">
      <TopBar />
      <section className="immersionHero">
        <div>
          <p>WHAT EPIC ADVENTURE</p>
          <h1>TONIGHT?</h1>
          <span>The squad is ready. The choice is yours.</span>
          <button onClick={() => notify("Finding your game")}>FIND YOUR GAME</button>
        </div>
      </section>
      <section className="immersionSquad">
        <h3>SQUAD ONLINE</h3>
        <SquadRow compact />
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

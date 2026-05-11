
import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Home, Search, Users, Mic, Library, User, Settings, Bell, CalendarDays, Heart,
  Trophy, Gamepad2, MessageCircle, SlidersHorizontal, Plus, ChevronRight,
  ChevronLeft, X, Share2, Bookmark, Play, Gamepad2 as Steam, Send, Smile, Gift, Dice5,
  Shield, Volume2, Headphones, Crown, Star, CheckCircle2, Zap
} from 'lucide-react';
import './styles.css';

const img = {
 helldivers:'https://cdn.cloudflare.steamstatic.com/steam/apps/553850/header.jpg',
 helldiversHero:'https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_hero.jpg',
 elden:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
 eldenHero:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_hero.jpg',
 bg3:'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg',
 bg3Hero:'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_hero.jpg',
 rust:'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg',
 rustHero:'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/library_hero.jpg',
 cyber:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
 cyberHero:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_hero.jpg',
 apex:'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg',
 apexHero:'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_hero.jpg',
 witcher:'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg',
 witcherHero:'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_hero.jpg',
 sea:'https://cdn.cloudflare.steamstatic.com/steam/apps/1172620/header.jpg',
 hunt:'https://cdn.cloudflare.steamstatic.com/steam/apps/594650/header.jpg',
 destiny:'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg',
 rdr:'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
 deep:'https://cdn.cloudflare.steamstatic.com/steam/apps/548430/header.jpg',
 lethal:'https://cdn.cloudflare.steamstatic.com/steam/apps/1966720/header.jpg',
 valheim:'https://cdn.cloudflare.steamstatic.com/steam/apps/892970/header.jpg',
 starfield:'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/header.jpg'
};

const games=[
 {id:'elden', title:'Elden Ring', sub:'Shadow of the Erdtree', art:img.elden, hero:img.eldenHero, price:'€59,99', score:9.8, playing:'1.2K', tags:['Action','RPG','Open World'], steam:'https://store.steampowered.com/app/1245620/ELDEN_RING/', desc:'Rise, Tarnished. Explore the Lands Between in an epic open-world RPG with brutal bosses, mystery and legendary co-op moments.'},
 {id:'helldivers', title:'HELLDIVERS™ 2', sub:'Managed democracy', art:img.helldivers, hero:img.helldiversHero, price:'€39,99', score:9.1, playing:'1.2K', tags:['Co-op','PvE','Shooter'], steam:'https://store.steampowered.com/app/553850/HELLDIVERS_2/', desc:'Chaotic co-op missions, frantic extractions and perfect squad banter across hostile planets.'},
 {id:'bg3', title:'Baldur’s Gate 3', sub:'Story-rich party RPG', art:img.bg3, hero:img.bg3Hero, price:'€59,99', score:9.7, playing:'730', tags:['RPG','Co-op','Story'], steam:'https://store.steampowered.com/app/1086940/Baldurs_Gate_3/', desc:'A legendary party adventure where every decision changes the story and every session becomes a memory.'},
 {id:'rust', title:'RUST', sub:'Weekly wipe chaos', art:img.rust, hero:img.rustHero, price:'€39,99', score:8.3, playing:'650', tags:['PvP','Survival','Base'], steam:'https://store.steampowered.com/app/252490/Rust/', desc:'Survive, raid, build and betray in a harsh sandbox that creates unforgettable squad stories.'},
 {id:'apex', title:'Apex Legends', sub:'Squad battle royale', art:img.apex, hero:img.apexHero, price:'Free', score:8.6, playing:'620', tags:['PvP','FPS','Squad'], steam:'https://store.steampowered.com/app/1172470/Apex_Legends/', desc:'Fast hero shooter action for squads that want quick, competitive sessions.'},
 {id:'cyber', title:'Cyberpunk 2077', sub:'Neon open world', art:img.cyber, hero:img.cyberHero, price:'€59,99', score:9.3, playing:'510', tags:['RPG','Open World'], steam:'https://store.steampowered.com/app/1091500/Cyberpunk_2077/', desc:'A neon-drenched RPG with a huge city, cinematic stories and stylish chaos.'},
 {id:'witcher', title:'The Witcher 3', sub:'Wild Hunt', art:img.witcher, hero:img.witcherHero, price:'€15,99', score:9.6, playing:'380', tags:['RPG','Story'], steam:'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/', desc:'A rich fantasy RPG with monster hunting, deep quests and one of gaming’s best worlds.'},
 {id:'hunt', title:'Hunt: Showdown', sub:'Extraction horror', art:img.hunt, hero:img.hunt, price:'€29,99', score:7.9, playing:'430', tags:['PvPvE','Tactical'], steam:'https://store.steampowered.com/app/594650/Hunt_Showdown_1896/', desc:'Dark, tense extraction shooter where every sound matters and every match tells a story.'},
 {id:'sea', title:'Sea of Thieves', sub:'Pirate sandbox', art:img.sea, hero:img.sea, price:'€39,99', score:8.2, playing:'540', tags:['Co-op','PvP'], steam:'https://store.steampowered.com/app/1172620/Sea_of_Thieves_2024_Edition/', desc:'Sail, loot and cause chaos together in a pirate world built for shared stories.'},
 {id:'destiny', title:'Destiny 2', sub:'Guardians unite', art:img.destiny, hero:img.destiny, price:'Free', score:7.8, playing:'420', tags:['PvE','Loot'], steam:'https://store.steampowered.com/app/1085660/Destiny_2/', desc:'Loot, raids and sci-fi action for squads that love progression.'},
 {id:'rdr', title:'Red Dead Redemption 2', sub:'Western epic', art:img.rdr, hero:img.rdr, price:'€59,99', score:9.4, playing:'360', tags:['Story','Open World'], steam:'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/', desc:'A cinematic western with atmosphere, story and slow-burn immersion.'},
 {id:'deep', title:'Deep Rock Galactic', sub:'Rock and stone', art:img.deep, hero:img.deep, price:'€29,99', score:9.0, playing:'390', tags:['Co-op','PvE'], steam:'https://store.steampowered.com/app/548430/Deep_Rock_Galactic/', desc:'Mining, bugs, beer and rock-solid co-op missions.'},
 {id:'lethal', title:'Lethal Company', sub:'Co-op horror comedy', art:img.lethal, hero:img.lethal, price:'€9,75', score:8.4, playing:'610', tags:['Horror','Co-op'], steam:'https://store.steampowered.com/app/1966720/Lethal_Company/', desc:'Terrifying and hilarious scrap runs with friends.'},
 {id:'valheim', title:'Valheim', sub:'Viking survival', art:img.valheim, hero:img.valheim, price:'€19,99', score:8.9, playing:'440', tags:['Survival','Co-op'], steam:'https://store.steampowered.com/app/892970/Valheim/', desc:'A viking survival world for long squad progression.'}
];
const deals = {
 elden:{steam:'€59,99', key:'€42,49', shop:'AllKeyShop', owned:4, wished:3},
 helldivers:{steam:'€39,99', key:'€31,89', shop:'Kinguin', owned:5, wished:2},
 bg3:{steam:'€59,99', key:'€48,20', shop:'AllKeyShop', owned:3, wished:5},
 rust:{steam:'€39,99', key:'€28,10', shop:'Kinguin', owned:6, wished:2},
 apex:{steam:'Free', key:'Free', shop:'Steam', owned:7, wished:1},
 cyber:{steam:'€59,99', key:'€24,99', shop:'AllKeyShop', owned:2, wished:4},
 witcher:{steam:'€15,99', key:'€7,49', shop:'Kinguin', owned:5, wished:1},
 hunt:{steam:'€29,99', key:'€18,99', shop:'AllKeyShop', owned:2, wished:3},
 sea:{steam:'€39,99', key:'€21,50', shop:'Kinguin', owned:2, wished:2},
 destiny:{steam:'Free', key:'Free', shop:'Steam', owned:4, wished:1},
 rdr:{steam:'€59,99', key:'€19,99', shop:'AllKeyShop', owned:3, wished:2},
 deep:{steam:'€29,99', key:'€12,99', shop:'Kinguin', owned:7, wished:2},
 lethal:{steam:'€9,75', key:'€6,49', shop:'AllKeyShop', owned:4, wished:4},
 valheim:{steam:'€19,99', key:'€9,99', shop:'Kinguin', owned:5, wished:3}
};
function gameDeal(game){
 return deals[game.id] || {steam:game.price||'€--', key:'Check deals', shop:'AllKeyShop', owned:0, wished:0};
}


const legendaryAvatars = Array.from({length:20},(_,i)=>({
 id:`legendary-${i+1}`,
 name:`Legendary ${String(i+1).padStart(3,'0')}`,
 url:`/avatars/legendary-${String(i+1).padStart(3,'0')}.png`,
 type:'Legendary'
}));

const militaryAvatars = Array.from({length:20},(_,i)=>({
 id:`military-${i+1}`,
 name:`Operator ${String(i+1).padStart(3,'0')}`,
 url:`/avatars/military-${String(i+1).padStart(3,'0')}.png`,
 type:'Military'
}));

const avatarSeeds=['operator-01','amazon-queen','cyber-ronin','ghost-helmet','scarlet-vanguard','void-captain','night-wolf','gold-paladin','neon-ranger','blade-medic','storm-pilot','iron-oracle'];
const users=['Shane','Leah','Tom','Maya','Sven','Jaron','Zoe','Liam','Kevin','Rook','Nyx','Valk'].map((name,i)=>({
 name, avatar: legendaryAvatars[i % legendaryAvatars.length]?.url || `/avatars/legendary-${String((i%100)+1).padStart(3,'0')}.png`,
 role:['Leader','Rifleman','Wipe Architect','Support','Night Stalker','Raid Caller'][i%6],
 status:['Online','In Game','In Lobby','Online'][i%4],
 game:games[i%games.length].title
}));


const squadAvatarSet = [...legendaryAvatars, ...militaryAvatars];


const nav=[
 ['home', Home, 'Home'],
 ['explore', Search, 'Explore'],
 ['parties', Users, 'Parties'],
 ['voice', Mic, 'Voice'],
 ['library', Library, 'Library'],
 ['profile', User, 'Profile']
];

function App(){
 const [page,setPage]=useState('home');
 const [wishlist,setWishlist]=useState(['elden','rdr','witcher']);
 const [selected,setSelected]=useState(null);
 const [chatOpen,setChatOpen]=useState(false);
 const [toast,setToast]=useState('Clean rebuild v0.5 ready');
 const [query,setQuery]=useState('');
 const [partyMembers,setPartyMembers]=useState(users.slice(0,4));
 const toggleWish=(id)=>setWishlist(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);
 const ctx={page,setPage,wishlist,toggleWish,setSelected,setToast,query,setQuery,partyMembers,setPartyMembers,setChatOpen};
 return <div className="appShell">
   <DesktopSidebar page={page} setPage={setPage}/>
   <div className="appMain">
     <Topbar query={query} setQuery={setQuery}/>
     {page==='home'&&<HomePage {...ctx}/>}
     {page==='explore'&&<ExplorePage {...ctx}/>}
     {page==='parties'&&<PartiesPage {...ctx}/>}
     {page==='voice'&&<VoicePage {...ctx}/>}
     {page==='library'&&<LibraryPage {...ctx}/>}
     {page==='profile'&&<ProfilePage {...ctx}/>}
     {page==='settings'&&<SettingsPage {...ctx}/>}
   </div>
   <MobileNav page={page} setPage={setPage}/>
   <FloatingChat open={chatOpen} setOpen={setChatOpen}/>
   {selected&&<GameDetail game={selected} toggleWish={toggleWish} wishlist={wishlist} close={()=>setSelected(null)} setToast={setToast}/>}
   {toast&&<Toast text={toast} clear={()=>setToast('')}/>}
 </div>
}

function DesktopSidebar({page,setPage}){
 return <aside className="sidebar desktopOnly">
  <div className="logo"><Zap size={24}/><b>SQUADUP</b></div>
  <nav>{nav.map(([id,Icon,label])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon size={17}/><span>{label}</span></button>)}</nav>
  <div className="shortcuts"><small>SHORTCUTS</small>{games.slice(1,5).map(g=><button key={g.id}><img src={g.art}/><span>{g.title}</span></button>)}</div>
  <button className="sideSettings" onClick={()=>setPage('settings')}><Settings size={17}/><span>Settings</span></button>
  <div className="sideUser"><img src={users[0].avatar}/><div><b>Shane</b><small>Online</small></div></div>
 </aside>
}

function Topbar({query,setQuery}){
 return <header className="topbar desktopOnly">
  <div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search games, people, parties..."/></div>
  <div className="topicons"><Bell size={17}/><CalendarDays size={17}/><MessageCircle size={17}/><Trophy size={17}/><img src={users[0].avatar}/></div>
 </header>
}

function MobileHeader(){return <header className="mobileHeader mobileOnly"><div className="logo"><Zap size={23}/><b>SQUADUP</b><small>v0.5</small></div><div><Search size={18}/><Bell size={18}/><img src={users[0].avatar}/></div></header>}

function MobileNav({page,setPage}){
 return <nav className="mobileNav mobileOnly">{nav.slice(0,5).map(([id,Icon,label])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon size={21}/><small>{label}</small></button>)}</nav>
}

function HomePage({setPage,setSelected,setToast}){
 return <Page><MobileHeader/>
  <section className="desktopHero">
    <div className="heroBg" style={{backgroundImage:`linear-gradient(90deg,#080a13 8%,rgba(8,10,19,.35)),url(${games[0].hero})`}}>
     <p className="accent">FEATURED</p><h1>{games[0].title}</h1><h2>{games[0].sub}</h2><p>{games[0].desc}</p><button className="primary" onClick={()=>setToast('Party launched')}>Play Now</button><button onClick={()=>setSelected(games[0])}>View Game</button>
    </div>
  </section>
  <section className="mobileHomeHero mobileOnly">
   <div className="welcome"><img src={users[0].avatar}/><div><h1>Welcome back, Shane</h1><p>Ready to squad up?</p></div></div>
   <SquadCard setPage={setPage}/>
  </section>
  <div className="homeGrid">
   <main>
    <SectionTitle title="Popular Right Now"/><HorizontalRow items={games.slice(1,7)} setSelected={setSelected}/>
    <SquadDock setPage={setPage}/>
    <SectionTitle title="Playing Now"/><CardGrid items={games.slice(2,6)} setSelected={setSelected}/>
    <Panel title="Recent Activity"><ActivityList/></Panel>
   </main>
   <aside className="rightPanel desktopOnly"><Panel title="Social Feed"><ActivityList/></Panel><Panel title="Online Friends">{users.slice(1,6).map(u=><UserLine key={u.name} user={u}/>)}</Panel></aside>
  </div>
 </Page>
}

function ExplorePage({wishlist,toggleWish,setSelected,setToast}){
 const [mode,setMode]=useState('immersive');
 const [filter,setFilter]=useState('All');
 const filters=['All','Action','RPG','FPS','Survival','Co-op'];
 const filtered=filter==='All'?games:games.filter(g=>g.tags.some(t=>t.toLowerCase().includes(filter.toLowerCase())));
 return <Page className="explorePage"><MobileHeader/>
  <div className="modeSwitch"><button className={mode==='immersive'?'active':''} onClick={()=>setMode('immersive')}>SquadUp Immersive</button><button className={mode==='command'?'active':''} onClick={()=>setMode('command')}>Command View</button></div>
  {mode==='command'&&<div className="chipbar">{filters.map(f=><button className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>}
  {mode==='immersive'?<ImmersiveExplore games={filtered} wishlist={wishlist} toggleWish={toggleWish} setSelected={setSelected}/>:<CommandExplore games={filtered} wishlist={wishlist} toggleWish={toggleWish} setSelected={setSelected}/>}
 </Page>
}

function ImmersiveExplore({games,wishlist,toggleWish,setSelected}){
 const hero=games[0] || games[1];
 const endlessBlocks=[
  {type:'double', a:'Steam Specials', b:'Most Played Today', start:0},
  {type:'split', title:'Top Sellers', mode:'spotlight-left', start:4},
  {type:'compact', title:'New Releases', start:5},
  {type:'split', title:'Coming Soon', mode:'list-left', start:7},
  {type:'double', a:'Trending Free', b:'Popular New', start:9},
  {type:'split', title:'Co-op Deals', mode:'spotlight-left', start:2},
  {type:'compact', title:'LAN Party Picks', start:3},
  {type:'split', title:'Friends Are Wishlisting', mode:'list-left', start:6},
  {type:'double', a:'Co-op Top Sellers', b:'Survival Discounts', start:1},
  {type:'split', title:'Squad Purchase Quests', mode:'spotlight-left', start:8},
  {type:'double', a:'PvP Trending', b:'Ranked With Friends', start:10},
  {type:'split', title:'Steam Weekend Deals', mode:'list-left', start:11},
  {type:'compact', title:'Under €20 Deals', start:12},
  {type:'split', title:'Hidden Steam Gems', mode:'spotlight-left', start:13},
  {type:'double', a:'Survival Worlds', b:'Base Building Deals', start:14},
  {type:'split', title:'LAN Party Picks', mode:'list-left', start:15},
  {type:'compact', title:'Quick Session Games', start:16},
  {type:'split', title:'Squad Challenges', mode:'spotlight-left', start:17},
  {type:'double', a:'Story Adventures', b:'Open World Escapes', start:18},
  {type:'split', title:'Fresh Trailers', mode:'list-left', start:19},
  {type:'compact', title:'Most Wishlisted', start:20},
  {type:'split', title:'Friends Are Playing', mode:'spotlight-left', start:21},
  {type:'double', a:'Cozy Co-op', b:'Chaos Co-op', start:22},
  {type:'split', title:'Extraction Nights', mode:'list-left', start:23},
  {type:'compact', title:'Recently Updated', start:24},
  {type:'split', title:'Boss Fight Energy', mode:'spotlight-left', start:25},
  {type:'double', a:'Tactical Picks', b:'Shooter Rotation', start:26},
  {type:'split', title:'SquadUp Spotlight', mode:'list-left', start:27},
  {type:'compact', title:'Next Adventure Ideas', start:28},
  {type:'split', title:'Community Favorites', mode:'spotlight-left', start:29},
  {type:'double', a:'Late Night Queue', b:'Weekend Grind', start:30},
  {type:'split', title:'Because Your Squad Likes RPGs', mode:'list-left', start:31},
  {type:'compact', title:'Steam Trending Rotation', start:32},
  {type:'split', title:'Backlog Builder Deals', mode:'spotlight-left', start:33},
  {type:'double', a:'Party Ready Deals', b:'Voice Chat Recommended', start:34},
  {type:'split', title:'Discover More Worlds', mode:'list-left', start:35},
 ];
 return <div className="exploreExactV53">
   <section className="exactHero v53Hero" style={{backgroundImage:`linear-gradient(90deg,#070912 7%,rgba(7,9,18,.35) 60%,#070912 100%),url(${hero.hero})`}}>
    <button className="exactHeroArrow left"><ChevronLeft size={22}/></button>
    <div className="exactHeroCopy">
      <p className="accent">Featured Release</p>
      <h1>{hero.title}</h1>
      <h2>{hero.sub}</h2>
      <p>{hero.desc}</p>
      <div className="exactHeroActions">
        <button className="primary" onClick={()=>setSelected(hero)}>Play Now</button>
        <button onClick={()=>setSelected(hero)}>View Game</button>
      </div>
    </div>
    <aside className="exactHeroStack desktopOnly">
      {games.slice(1,5).map((g,i)=><button className={i===0?'active':''} key={g.id} onClick={()=>setSelected(g)} style={{backgroundImage:`linear-gradient(90deg,rgba(0,0,0,.05),rgba(0,0,0,.55)),url(${g.art})`}}>
        <span>{g.title}</span><small>{g.sub}</small>
      </button>)}
    </aside>
    <button className="exactHeroArrow right"><ChevronRight size={22}/></button>
    <div className="exactDots"><span className="active"></span><span></span><span></span><span></span><span></span></div>
   </section>

   <div className="endlessExploreFeed">
    {endlessBlocks.map((block,i)=>{
      const pool=Array.from({length:8}).flatMap(()=>games);
      if(block.type==='double'){
        return <section className="endlessDouble" key={i}>
          <ExactLoopCarousel title={block.a} subtitle={i===0?'Top picks across all genres':'Fresh picks from your squad'} items={pool.slice(block.start,block.start+13)} wishlist={wishlist} toggleWish={toggleWish} setSelected={setSelected}/>
          <ExactLoopCarousel title={block.b} items={pool.slice(block.start+4,block.start+17)} wishlist={wishlist} toggleWish={toggleWish} setSelected={setSelected}/>
        </section>
      }
      if(block.type==='compact'){
        return <ExactLoopCarousel key={i} title={block.title} subtitle="Jump into what you love" compact items={pool.slice(block.start,block.start+14)} wishlist={wishlist} toggleWish={toggleWish} setSelected={setSelected}/>
      }
      return <ExploreSplitBlock key={i} title={block.title} mode={block.mode} items={pool.slice(block.start,block.start+8)} wishlist={wishlist} toggleWish={toggleWish} setSelected={setSelected}/>
    })}
   </div>
   <div className="endlessContinue">
    <span></span>
    <p>Keep scrolling — SquadUp keeps loading new discovery blocks</p>
   </div>
  </div>
}

function ExactLoopCarousel({title,subtitle,items,wishlist,toggleWish,setSelected,compact=false}){
 const ref=useRef(null);
 const loopItems=items.concat(items).concat(items);
 const normalize=()=>{
  const el=ref.current;
  if(!el) return;
  const third=el.scrollWidth/3;
  if(el.scrollLeft < third*0.35) el.scrollLeft += third;
  if(el.scrollLeft > third*2.25) el.scrollLeft -= third;
 };
 const move=(dir)=>{
  const el=ref.current;
  if(!el) return;
  const card=compact?182:202;
  const step=card*3;
  el.scrollBy({left:dir*step,behavior:'smooth'});
  setTimeout(normalize,560);
 };
 React.useEffect(()=>{
  const el=ref.current;
  if(!el) return;
  requestAnimationFrame(()=>{ el.scrollLeft = el.scrollWidth/3; });
  const onScroll=()=>window.clearTimeout(el._loopTimer) || (el._loopTimer=window.setTimeout(normalize,120));
  el.addEventListener('scroll',onScroll,{passive:true});
  return ()=>el.removeEventListener('scroll',onScroll);
 },[]);
 return <section className={compact?'exactCarousel compact loopCarousel':'exactCarousel loopCarousel'}>
  <div className="exactSectionHead">
   <div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>
  </div>
  <button className="exactCarouselArrow left" onClick={()=>move(-1)}><ChevronLeft size={20}/></button>
  <div className="exactCarouselViewport">
   <div className="exactCardTrack loopTrack" ref={ref}>
    {loopItems.map((g,i)=><button className="exactGameTile" key={g.id+i} onClick={()=>setSelected(g)}>
      <img src={g.art}/>
      <button className={wishlist.includes(g.id)?'tileHeart liked':'tileHeart'} onClick={(e)=>{e.stopPropagation();toggleWish(g.id)}}><Heart size={14} fill={wishlist.includes(g.id)?'currentColor':'none'}/></button>
      <div>
        <b>{g.title}</b>
        <small>{g.sub}</small>
        <span className="priceLine"><strong>{gameDeal(g).steam}</strong><i>{gameDeal(g).shop}: {gameDeal(g).key}</i></span>
        <span className="socialLine">👥 {gameDeal(g).owned} own · ♥ {gameDeal(g).wished} want</span>
      </div>
      <em>{g.score}</em>
    </button>)}
   </div>
  </div>
  <button className="exactCarouselArrow right" onClick={()=>move(1)}><ChevronRight size={20}/></button>
 </section>
}

function ExactCarousel({title,subtitle,items,wishlist,toggleWish,setSelected,compact=false}){
 const ref=useRef(null);
 const move=(dir)=>{
  const el=ref.current;
  if(!el) return;
  const step=Math.min(el.clientWidth*.82, 760);
  el.scrollBy({left:dir*step,behavior:'smooth'});
  setTimeout(()=>{
    if(el.scrollLeft > el.scrollWidth - el.clientWidth - 80) el.scrollTo({left:0,behavior:'smooth'});
    if(el.scrollLeft < 5 && dir < 0) el.scrollTo({left:el.scrollWidth/2,behavior:'smooth'});
  },520);
 };
 return <section className={compact?'exactCarousel compact':'exactCarousel'}>
  <div className="exactSectionHead">
   <div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>
  </div>
  <button className="exactCarouselArrow left" onClick={()=>move(-1)}><ChevronLeft size={20}/></button>
  <div className="exactCarouselViewport">
   <div className="exactCardTrack" ref={ref}>
    {items.map((g,i)=><button className="exactGameTile" key={g.id+i} onClick={()=>setSelected(g)}>
      <img src={g.art}/>
      <button className={wishlist.includes(g.id)?'tileHeart liked':'tileHeart'} onClick={(e)=>{e.stopPropagation();toggleWish(g.id)}}><Heart size={14} fill={wishlist.includes(g.id)?'currentColor':'none'}/></button>
      <div>
        <b>{g.title}</b>
        <small>{g.sub}</small>
        <span className="priceLine"><strong>{gameDeal(g).steam}</strong><i>{gameDeal(g).shop}: {gameDeal(g).key}</i></span>
        <span className="socialLine">👥 {gameDeal(g).owned} own · ♥ {gameDeal(g).wished} want</span>
      </div>
      <em>{g.score}</em>
    </button>)}
   </div>
  </div>
  <button className="exactCarouselArrow right" onClick={()=>move(1)}><ChevronRight size={20}/></button>
 </section>
}

function ExploreSplitBlock({title,mode,items,wishlist,toggleWish,setSelected}){
 const main=items[0];
 const list=items.slice(1,6);
 const banner=<div className="exactSpotlight v53Spotlight" style={{backgroundImage:`linear-gradient(90deg,#100d1b 10%,rgba(16,13,27,.42)),url(${main.hero || main.art})`}}>
   <p className="accent">{title}</p>
   <h2>{title==='New & Upcoming'?'Games you don’t want to miss':title==='Community Spotlight'?'Epic plays':title==='SquadUp Rewards'?'Unlock exclusive rewards and perks':main.title}</h2>
   <p>{main.desc}</p>
   <button className="primary" onClick={()=>setSelected(main)}>{title==='Live Events'?'View Events':title==='SquadUp Rewards'?'View Rewards':'View Game'}</button>
  </div>;
 const listPanel=<div className="exactRankList v53List">
   <div className="listHeader"><h2>{title==='New & Upcoming'?'New & Upcoming':'Trending Now'}</h2><small>{title==='New & Upcoming'?'Release radar':'See what’s blowing up'}</small></div>
   {list.map((g,i)=><button className="rankRow" key={g.id+i} onClick={()=>setSelected(g)}>
     <b>{i+1}</b><img src={g.art}/><span>{g.title}</span><small>{g.playing} playing · {gameDeal(g).owned} own · ♥ {gameDeal(g).wished}</small><em>{g.score}</em>
   </button>)}
  </div>;
 const community=<div className="exactCommunity v53Community" style={{backgroundImage:`linear-gradient(90deg,#120d22 15%,rgba(18,13,34,.32)),url(${items[2]?.hero || items[2]?.art})`}}>
    <p className="accent">Join the Community</p>
    <h2>Find your squad</h2>
    <p>Connect with players around the world and play together.</p>
    <button className="primary">Explore Parties</button>
  </div>;
 if(mode==='list-left') return <section className="exactFeatureSplit v53Split three">{listPanel}{banner}{community}</section>;
 return <section className="exactFeatureSplit v53Split three">{banner}{listPanel}{community}</section>;
}

function FeatureListBlock({title,flip,items,wishlist,toggleWish,setSelected}){
 const hero=items[0];
 const list=items.slice(1,6);
 return <section className={`featureListBlock ${flip?'flip':''}`}>
  <div className="featureBanner" style={{backgroundImage:`linear-gradient(90deg,#090b14 10%,rgba(9,11,20,.35)),url(${hero.hero || hero.art})`}}>
    <p className="accent">{title}</p>
    <h2>{hero.title}</h2>
    <p>{hero.desc}</p>
    <button className="primary" onClick={()=>setSelected(hero)}>View Game</button>
  </div>
  <div className="featureList">
    <div className="panelHead"><h2>Trending Now</h2><button>View All</button></div>
    {list.map((g,idx)=><button className="featureListItem" key={g.id+idx} onClick={()=>setSelected(g)}>
      <b>{idx+1}</b>
      <img src={g.art}/>
      <span><strong>{g.title}</strong><small>{g.playing} playing</small></span>
      <em>{g.score}</em>
      <i className={wishlist.includes(g.id)?'liked':''} onClick={(e)=>{e.stopPropagation();toggleWish(g.id)}}>♥</i>
    </button>)}
  </div>
 </section>
}

function CommandExplore({games,wishlist,toggleWish,setSelected}){
 return <div className="commandLayout">
  <section className="commandHero" style={{backgroundImage:`linear-gradient(90deg,#080a13 18%,rgba(8,10,19,.2)),url(${games[0]?.hero})`}}><div><h1>{games[0]?.title}</h1><p>{games[0]?.desc}</p><button className="primary" onClick={()=>setSelected(games[0])}>Open Game</button></div></section>
  <Panel title="Popular Right Now">{games.map(g=><ListGame key={g.id} game={g} setSelected={setSelected}/>)}</Panel>
  <CardGrid items={games} setSelected={setSelected}/>
 </div>
}

function PartiesPage({partyMembers,setPartyMembers,setChatOpen,setToast}){
 const [messages,setMessages]=useState(['Yo bois, who’s down to game tonight?','I’m in! What are we playing?','How about Elden Ring?']);
 const [txt,setTxt]=useState('');
 const send=()=>{if(!txt.trim())return;setMessages([...messages,txt]);setTxt('')};
 return <Page><MobileHeader/>
  <div className="partyLayout">
   <section className="partyStage">
    <div className="partyHead"><div><h1>Squad Alpha <Shield size={17}/></h1><p>8 Members · Private</p></div><button className="primary" onClick={()=>setToast('Invite sent')}>Invite</button></div>
    <div className="tabs"><button className="active">Lobby</button><button>Vote Next</button><button>Dice Roll</button><button>Settings</button></div>
    <div className="orbit">{partyMembers.map((u,i)=><button className={`orb o${i}`} key={u.name}><img src={u.avatar}/><span>{u.name}</span>{i===0&&<Crown size={15}/>}</button>)}<div className="crest"><Zap size={56}/><small>Drag to Reposition</small></div></div>
    <div className="controlRow">{[Mic,Volume2,Headphones,Settings,Dice5].map((Icon,i)=><button className={i===2?'danger':''}><Icon size={18}/></button>)}</div>
    <button className="leave">Leave Party</button>
   </section>
   <aside className="chatPanel">
    <div className="chatHead"><h2>Squad Alpha</h2><div><MessageCircle size={16}/><Settings size={16}/></div></div>
    <div className="tabs small"><button className="active">Chat</button><button>Details</button></div>
    <div className="messages">{messages.map((m,i)=><div className={i===2?'msg cardMsg':'msg'}><img src={users[i].avatar}/><p><b>{users[i].name}</b><span>{m}</span>{i===2&&<GameShare game={games[0]}/>}</p></div>)}</div>
    <div className="chatActions"><button>Poll</button><button>Suggest Game</button><button>Share Wishlist</button></div>
    <div className="inputbar"><input value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Message Squad Alpha..."/><Smile size={17}/><button onClick={send}><Send size={16}/></button></div>
   </aside>
  </div>
 </Page>
}

function VoicePage(){
 const gameThemes={
  elden:{accent:'#d6a23f', glow:'rgba(214,162,63,.38)', label:'Fantasy Raid', channel:'SquadUp - Elden Ring Lobby'},
  helldivers:{accent:'#f4c430', glow:'rgba(244,196,48,.34)', label:'Co-op Ops', channel:'SquadUp - HELLDIVERS Drop'},
  bg3:{accent:'#a855f7', glow:'rgba(168,85,247,.38)', label:'Story Party', channel:'SquadUp - BG3 Campaign'},
  rust:{accent:'#f97316', glow:'rgba(249,115,22,.34)', label:'Survival Wipe', channel:'SquadUp - Rust Wipe Crew'},
  apex:{accent:'#ff6b2c', glow:'rgba(255,107,44,.34)', label:'Ranked Squad', channel:'SquadUp - Apex Lobby'},
  cyber:{accent:'#22d3ee', glow:'rgba(34,211,238,.34)', label:'Neon Run', channel:'SquadUp - Night City'},
  witcher:{accent:'#3b82f6', glow:'rgba(59,130,246,.34)', label:'Monster Hunt', channel:'SquadUp - Witcher Contracts'}
 };
 const [hostGame,setHostGame]=useState(games[1]);
 const [joined,setJoined]=useState(false);
 const [muted,setMuted]=useState(false);
 const [deafened,setDeafened]=useState(false);
 const [botStatus,setBotStatus]=useState('Ready for test');
 const [selectedTemplate,setSelectedTemplate]=useState('squad');
 const [notifications,setNotifications]=useState([
  {id:1, text:`Shane is hosting ${games[1].title}`, time:'now'}
 ]);
 const [gamePickerOpen,setGamePickerOpen]=useState(false);
 const isHost=true;
 const theme=gameThemes[hostGame.id] || gameThemes.apex;
 const voiceMembers=users.slice(0,6).map((u,i)=>({
  ...u,
  state:['Host','Speaking','Muted','In Game','Away','In Voice'][i],
  ring:['host','speaking','muted','online','away','online'][i]
 }));
 const templates={
  squad:`🎮 ${hostGame.title} squad is live! Join the Discord voice channel and squad up.`,
  buy:`🛒 Should we all get ${hostGame.title}? Vote in SquadUp and check the deals.`,
  lan:`💻 LAN party planning started for ${hostGame.title}. Drop your availability.`,
  poll:`📊 Vote for the next game: ${hostGame.title} is on the shortlist.`
 };
 const discordUrl=import.meta.env.VITE_DISCORD_CHANNEL_URL || '';
 const discordInviteUrl=import.meta.env.VITE_DISCORD_INVITE_URL || discordUrl || '';
 const openDiscord=(target='channel')=>{
  const url=target==='invite' ? discordInviteUrl : discordUrl;
  if(url) window.open(url,'_blank','noopener,noreferrer');
  else setBotStatus('Add VITE_DISCORD_INVITE_URL or VITE_DISCORD_CHANNEL_URL');
 };
 const notifyParty=(nextGame,previousGame)=>{
  const note={id:Date.now(), text:`Shane changed the party game from ${previousGame.title} to ${nextGame.title}`, time:'just now'};
  setNotifications(prev=>[note,...prev].slice(0,4));
 };
 const changeHostGame=(nextGame)=>{
  if(!isHost){
   setBotStatus('Only the party host can change the game');
   return;
  }
  if(nextGame.id===hostGame.id) return;
  const previousGame=hostGame;
  setHostGame(nextGame);
  setGamePickerOpen(false);
  notifyParty(nextGame,previousGame);
  setBotStatus(`Party notified: ${nextGame.title}`);
 };
 const cycleHostGame=(step)=>{
  const pool=games.slice(0,7);
  const index=pool.findIndex(g=>g.id===hostGame.id);
  const next=pool[(index+step+pool.length)%pool.length];
  changeHostGame(next);
 };
 const runBotTest=async(action)=>{
  setBotStatus('Testing...');
  try{
   const res=await fetch(`/api/discord/${action}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({game:hostGame.title, channelName:theme.channel, template:templates[selectedTemplate]})
   });
   const data=await res.json().catch(()=>({ok:false}));
   setBotStatus(data.ok?'Discord bot test OK':'Set env vars to enable bot');
  }catch(e){
   setBotStatus('Bot API not configured yet');
  }
 };
 return <Page className="voiceGameCardPage"><MobileHeader/>
  <section className="voiceGameCardShell" style={{'--gameAccent':theme.accent,'--gameGlow':theme.glow}}>
   <main className="voiceGamePhone">
    <section className="gameVoiceHero" style={{backgroundImage:`linear-gradient(180deg,rgba(5,7,12,.18),rgba(5,7,12,.92)),linear-gradient(90deg,${theme.glow},transparent 70%),url(${hostGame.hero || hostGame.art})`}}>
      <div className="gameVoiceTop">
       <button aria-label="Previous game" onClick={()=>cycleHostGame(-1)}><ChevronLeft size={22}/></button>
       <button aria-label="Next game" onClick={()=>cycleHostGame(1)}><span></span><span></span><span></span></button>
      </div>
      <p className="voiceKicker">CURRENT GAME · HOST CONTROL</p>
      <button className="hostGameTitleBtn" onClick={()=>isHost&&setGamePickerOpen(!gamePickerOpen)} disabled={!isHost}>
       <h1>{hostGame.title}</h1>
       <small>{isHost?'Click to change party game':'Only host can change game'}</small>
      </button>
      {gamePickerOpen&&<div className="heroGamePicker">
       {games.slice(0,7).map(g=><button key={g.id} className={hostGame.id===g.id?'active':''} onClick={()=>changeHostGame(g)}><img src={g.art}/><span>{g.title}</span></button>)}
      </div>}
      <div className="hostLine"><img src={users[0].avatar}/><div><small>HOST</small><b>Shane</b></div><em>● In Voice</em><button onClick={()=>openDiscord('channel')}><MessageCircle size={21}/></button></div>
      <div className="gameMetaPills"><span>● 6 IN VOICE</span><span>🔒 {theme.label}</span></div>

      <div className="voiceControlOrbit">
       <button className={muted?'roundControl active':'roundControl'} onClick={()=>setMuted(!muted)}><Mic size={24}/><span>{muted?'Unmute':'Mute'}</span></button>
       <button className={joined?'mainMic active':'mainMic'} onClick={()=>setJoined(!joined)}><Mic size={46}/></button>
       <button className={deafened?'roundControl active':'roundControl'} onClick={()=>setDeafened(!deafened)}><Headphones size={24}/><span>{deafened?'Undeafen':'Deafen'}</span></button>
      </div>
      <p className="speakingLine">{joined?'You are connected':'You are previewing'} · {voiceMembers[1].name} is speaking</p>

      <div className="voiceMemberRail">
       {voiceMembers.map((m,i)=><button key={m.name} className={`memberDot ${m.ring}`}>
        <img src={m.avatar}/>
        <b>{m.name}</b>
        <small>{m.state}</small>
       </button>)}
      </div>
    </section>

    <section className="discordChannelCard">
      <div>
       <p>VOICE CHANNEL</p>
       <h2><MessageCircle size={22}/> {theme.channel}</h2>
       <small>Discord connected demo · Channel ID after setup</small>
      </div>
      <div className="channelActions">
       <button onClick={()=>navigator.clipboard?.writeText(discordUrl)}>⧉</button>
       <button onClick={()=>openDiscord('channel')}><Share2 size={20}/></button>
       <button onClick={()=>runBotTest('test')}><Settings size={20}/></button>
      </div>
    </section>

    <section className="discordTemplateCard">
      <div className="templateHead"><div><p>BOT TEMPLATE</p><h2>Push to Discord</h2></div><em>{botStatus}</em></div>
      <div className="templateTabs">
       {Object.keys(templates).map(k=><button key={k} className={selectedTemplate===k?'active':''} onClick={()=>setSelectedTemplate(k)}>{k}</button>)}
      </div>
      <p className="templatePreview">{templates[selectedTemplate]}</p>
      <button className="sendDiscordTemplate" onClick={()=>runBotTest('send-template')}><MessageCircle size={18}/> Send Template</button>
    </section>

    <footer className="voiceGameActions">
      <button onClick={()=>runBotTest('create-channel')}><Users size={20}/>Create</button>
      <button onClick={()=>navigator.share?.({title:'SquadUp Voice',text:`Join ${theme.channel}`,url:discordUrl})}><Share2 size={20}/>Share</button>
      <button className={joined?'leaveBtn':'joinBtn'} onClick={()=>setJoined(!joined)}>{joined?'Leave Voice':'Join Voice'}</button>
      <button onClick={()=>runBotTest('test')}><Settings size={20}/>Bot Test</button>
      <button onClick={()=>openDiscord('invite')}>↗<span>Connect</span></button>
    </footer>
   </main>

   <aside className="voiceGameSide">
    <section className="discordBotPanel">
     <div className="botPanelHead"><div><h2>Discord Bot — Test Ready</h2><p>Connect your own server in Vercel env vars</p></div><span>● {botStatus}</span></div>
     <div className="botIdentity"><div className="discordLogo">⌁</div><div><b>SquadUp Bot</b><small>Creates channels, sends templates, syncs status</small></div></div>
     {['Create Voice Channels','Send Templates & Invites','Slash Commands','Privacy Controls','Auto Cleanup Empty Channels'].map(x=><p className="botCheck" key={x}>✓ {x}</p>)}
     <button className="primary wide" onClick={()=>runBotTest('test')}>Test Bot in Discord</button>
    </section>

    <section className="gameSwitcherPanel">
     <h2>Dynamic Game Card Examples</h2>
     <p>Host game changes artwork, accent color and channel template.</p>
     <div className="gameSwitchGrid">
      {games.slice(0,7).map(g=><button key={g.id} className={hostGame.id===g.id?'active':''} onClick={()=>changeHostGame(g)} style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(0,0,0,.8)),url(${g.art})`}}>
       <span>{g.title}</span>
      </button>)}
     </div>
    </section>

    <section className="commandPreviewPanel">
     <h2>Discord Setup + Bot Commands</h2>
     <div className="discordTutorial">
      <p><b>1.</b> Create or choose your Discord server.</p>
      <p><b>2.</b> Invite the SquadUp bot with channel + message permissions.</p>
      <p><b>3.</b> Add Vercel env vars: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_TEXT_CHANNEL_ID, optional DISCORD_CATEGORY_ID.</p>
      <p><b>4.</b> Add VITE_DISCORD_INVITE_URL and VITE_DISCORD_CHANNEL_URL so app buttons open the right server/channel.</p>
     </div>
     {[
      ['/squad create','Create a temporary Discord voice channel'],
      ['/squad invite','Post an invite embed'],
      ['/squad game','Set current game and theme'],
      ['/squad poll','Start a vote'],
      ['/squad help','Show commands']
     ].map(([cmd,desc])=><div className="commandLine" key={cmd}><b>{cmd}</b><span>{desc}</span></div>)}
    </section>

    <section className="partyNotifyPanel">
     <h2>Party Notifications</h2>
     {notifications.map(n=><div className="partyNotice" key={n.id}><Bell size={16}/><span>{n.text}</span><small>{n.time}</small></div>)}
    </section>
   </aside>
  </section>
 </Page>
}

function LibraryPage({setSelected}){
 return <Page><MobileHeader/><h1>Library</h1><CardGrid items={games} setSelected={setSelected}/></Page>
}

function ProfilePage({wishlist,toggleWish,setSelected}){
 const wish=games.filter(g=>wishlist.includes(g.id));
 const [avatar,setAvatar]=useState(legendaryAvatars[0]?.url || squadAvatarSet[0].url);
 const [showAvatars,setShowAvatars]=useState(false);
 return <Page><MobileHeader/>
  <section className="profileHero">
   <button className="profileAvatarPicker" onClick={()=>setShowAvatars(true)} title="Change avatar">
    <img src={avatar}/>
    <span>Change Avatar</span>
   </button>
   <div><h1>Shane <Shield size={18}/></h1><p><span className="dot"></span>Online</p></div>
   <div className="profileStats"><b>87<small>Games</small></b><b>24<small>Friends</small></b><b>156<small>Achievements</small></b><b>2.1K<small>Hours</small></b></div>
  </section>
  <div className="tabs"><button className="active">Overview</button><button>Games</button><button>Wishlist</button><button>Achievements</button></div>
  <div className="profileGrid"><Panel title="About Me"><p>Squad leader. FPS enthusiast. Always up for a good time.</p><div className="titleChips"><span>LAN Captain</span><span>Night Stalker</span><span>Raid Caller</span></div><button className="primary avatarOpenBtn" onClick={()=>setShowAvatars(true)}>Choose Avatar</button></Panel><Panel title={`Wishlist (${wish.length})`}>{wish.map(g=><WishlistRow game={g} toggleWish={toggleWish} setSelected={setSelected}/>)}</Panel><Panel title="Recent Activity"><ActivityList/></Panel></div>
  {showAvatars&&<div className="avatarModal">
    <div className="avatarModalCard">
      <div className="avatarModalHead"><div><p className="accent">SquadUp Avatar Vault</p><h2>Choose Your Operator</h2><small>250 avatars: 150 gritty operators + 100 legendary skins</small></div><button onClick={()=>setShowAvatars(false)}><X size={18}/></button></div>
      <div className="avatarGrid">
        {squadAvatarSet.map(a=><button key={a.id} className={avatar===a.url?'selected':''} onClick={()=>{setAvatar(a.url);setShowAvatars(false);}}>
          <img src={a.url}/><span>{a.name}</span>
        </button>)}
      </div>
    </div>
  </div>}
 </Page>
}

function SettingsPage(){
 return <Page><MobileHeader/><h1>Settings</h1><div className="settingsGrid"><Panel title="Account">{['Profile Settings','Change Avatar','Change Banner'].map(x=><button className="settingLine">{x}<ChevronRight size={16}/></button>)}</Panel><Panel title="Appearance"><button className="settingLine">Theme <b>Dark Purple</b></button><div className="colors">{['#7c3aed','#a855f7','#ec4899','#22c55e','#ef4444','#3b82f6'].map(c=><span style={{background:c}}/> )}</div></Panel><Panel title="Language"><button className="settingLine">English<CheckCircle2 size={16}/></button><button className="settingLine">Nederlands</button></Panel></div></Page>
}

function Page({children,className=''}){return <main className={`page ${className}`}>{children}</main>}
function Panel({title,children}){return <section className="panel"><div className="panelHead"><h2>{title}</h2><button>View All</button></div>{children}</section>}
function SectionTitle({title}){return <div className="sectionTitle"><h2>{title}</h2><button>View All</button></div>}

function HorizontalRow({items,setSelected}){return <div className="hrow">{items.map(g=><GameCard key={g.id} game={g} setSelected={setSelected}/>)}</div>}
function Carousel({title,items,wishlist,toggleWish,setSelected}){
 const ref=useRef(null);
 const scroll=(dir)=>{const el=ref.current;if(!el)return;el.scrollBy({left:dir*520,behavior:'smooth'});setTimeout(()=>{if(el.scrollLeft>el.scrollWidth-el.clientWidth-600)el.scrollTo({left:0,behavior:'smooth'});if(el.scrollLeft<10&&dir<0)el.scrollTo({left:el.scrollWidth/2,behavior:'smooth'});},500)}
 return <section className="carousel"><SectionTitle title={title}/><button className="carNav left" onClick={()=>scroll(-1)}><ChevronLeft/></button><div className="hrow" ref={ref}>{items.map((g,i)=><GameCard key={g.id+i} game={g} wishlist={wishlist} toggleWish={toggleWish} setSelected={setSelected}/>)}</div><button className="carNav right" onClick={()=>scroll(1)}><ChevronRight/></button></section>
}

function GameCard({game,wishlist=[],toggleWish=()=>{},setSelected}){
 const liked=wishlist.includes(game.id);
 return <article className="gameCard" onClick={()=>setSelected(game)}><img src={game.art}/><div><b>{game.title}</b><small>{game.playing} playing · {gameDeal(game).owned} friends own</small><span className="priceLine small"><strong>{gameDeal(game).steam}</strong><i>{gameDeal(game).shop}: {gameDeal(game).key}</i></span><em>{game.score}</em></div><button className={liked?'like liked':'like'} onClick={(e)=>{e.stopPropagation();toggleWish(game.id)}}><Heart size={15} fill={liked?'currentColor':'none'}/></button></article>
}
function CardGrid({items,setSelected}){return <div className="cardGrid">{items.map(g=><GameCard key={g.id} game={g} setSelected={setSelected}/>)}</div>}
function ListGame({game,setSelected}){return <button className="listGame" onClick={()=>setSelected(game)}><img src={game.art}/><span><b>{game.title}</b><small>{game.playing} playing</small></span><em>{game.score}</em></button>}
function WishlistRow({game,toggleWish,setSelected}){return <div className="wishRow" onClick={()=>setSelected(game)}><img src={game.art}/><span>{game.title}</span><b>{game.price}</b><button onClick={(e)=>{e.stopPropagation();toggleWish(game.id)}}><Heart size={16} fill="currentColor"/></button></div>}
function UserLine({user}){return <div className="userLine"><img src={user.avatar}/><div><b>{user.name}</b><small>{user.status} · {user.game}</small></div><button>•••</button></div>}
function ActivityList(){return <div className="activityList">{['Leah invited you to a party','Tom is now online','Maya started playing Apex Legends','Achievement Unlocked'].map((a,i)=><div><img src={users[i+1].avatar}/><span><b>{a}</b><small>{i*5+2}m ago</small></span></div>)}</div>}
function SquadCard({setPage}){return <div className="squadCard"><div><h2>Squad Alpha</h2><p>8 Members · 3 Online</p><div className="avatarStack">{users.slice(0,5).map(u=><img src={u.avatar}/>)}</div></div><Shield size={62}/><button onClick={()=>setPage('parties')}>Open Squad</button></div>}
function SquadDock({setPage}){return <div className="squadDock"><Shield/><b>Squad Alpha</b><small>Party · 4 Members</small><div className="avatarStack">{users.slice(0,4).map(u=><img src={u.avatar}/>)}</div><button onClick={()=>setPage('voice')}><Mic size={16}/></button><button><Settings size={16}/></button><button className="danger" onClick={()=>setPage('parties')}>Leave Party</button></div>}
function GameShare({game}){return <div className="gameShare"><img src={game.art}/><span><b>{game.title}</b><small>{game.price}</small></span></div>}
function Toggle({label,on=false}){return <div className="toggleLine"><span>{label}</span><button className={on?'toggle on':'toggle'}></button></div>}

function GameDetail({game,close,wishlist,toggleWish,setToast}){
 const liked=wishlist.includes(game.id);
 return <div className="gameDetail">
   <aside className="detailRail desktopOnly"><div className="logo"><Zap/><b>SQUADUP</b></div>{[Home,Search,Users,CalendarDays,MessageCircle,Trophy,Shield].map((Icon,i)=><button className={i===1?'active':''}><Icon size={20}/></button>)}<img src={users[0].avatar}/><button><Settings/></button></aside>
   <main>
    <section className="detailHero" style={{backgroundImage:`linear-gradient(90deg,#060812 8%,rgba(6,8,18,.42),#060812 95%),url(${game.hero})`}}>
      <div className="detailActions"><button onClick={close}><ChevronLeft/></button><button onClick={()=>toggleWish(game.id)}><Bookmark fill={liked?'currentColor':'none'}/></button><button><Share2/></button></div>
      <div className="buyActions"><a href={game.steam} target="_blank" className="primary steamLarge"><Steam/>PLAY ON STEAM</a><button>{game.price}</button><button>⌄</button></div>
      <div className="detailCopy"><h1>{game.title}</h1><div className="tags">{game.tags.map(t=><span>{t}</span>)}</div><p><Star fill="currentColor"/> 4.8 · 328K reviews · Steam · Released 25 Feb, 2022</p><p>{game.desc}</p><div className="mediaStrip"><a href="https://www.youtube.com/results?search_query=game+trailer" target="_blank" className="thumb play" style={{backgroundImage:`url(${game.art})`}}><Play fill="currentColor"/></a>{[0,1,2,3].map(i=><button className="thumb" style={{backgroundImage:`url(${game.art})`}} />)}<button className="thumb more">+18</button></div></div>
      <aside className="friendsPlay"><h3>PLAY WITH FRIENDS</h3>{users.slice(0,3).map(u=><UserLine user={u}/>) }<button className="primary">JOIN VOICE</button></aside>
    </section>
    <div className="tabs detailTabs"><button className="active">Overview</button><button>Activity</button><button>Guides</button><button>Discussions</button><button>Media</button><button>Achievements</button></div>
    <div className="detailGrid"><Panel title="About this Game"><p>{game.desc} SquadUp tracks who plays, who wants it, and whether the squad should buy together.</p><button className="linkBtn">Read more</button></Panel><Panel title="Latest Activity"><ActivityList/></Panel><Panel title="Game Info">{['Release Date','Developer','Publisher','Genres','Steam Deck','Multiplayer'].map((x,i)=><div className="infoLine"><span>{x}</span><b>{i===3?game.tags.join(', '):i===5?'Co-op, PvP':'Verified'}</b></div>)}</Panel><Panel title="Achievements"><h3>42/42 Unlocked</h3><div className="progress"><span style={{width:'100%'}}/></div><div className="achIcons"><Trophy/><Shield/><Crown/></div></Panel></div>
    <div className="detailActionsRow"><button onClick={()=>setToast('Recommend dialog opened')}>Recommend to Friend</button><button onClick={()=>setToast('Squad Quest started')}>Ask Squad to Buy</button><button className={liked?'liked':''} onClick={()=>toggleWish(game.id)}><Heart fill={liked?'currentColor':'none'}/> {liked?'Remove from Wishlist':'Add to Wishlist'}</button></div>
   </main>
  </div>
}

function FloatingChat({open,setOpen}){
 return <>
  <button className="chatFab" onClick={()=>setOpen(!open)}><MessageCircle/><span>Party Chat</span><i></i></button>
  {open&&<div className="chatPopup"><div className="chatHead"><h2>Squad Chat</h2><button onClick={()=>setOpen(false)}><X/></button></div><div className="messages"><div className="msg"><img src={users[1].avatar}/><p><b>Leah</b><span>Ready?</span></p></div><div className="msg cardMsg"><img src={users[0].avatar}/><p><b>Shane</b><span>Let’s queue after this.</span></p></div></div><div className="inputbar"><input placeholder="Message..."/><button><Send/></button></div></div>}
 </>
}
function Toast({text,clear}){setTimeout(clear,3500);return <div className="toast"><CheckCircle2/> {text}</div>}

createRoot(document.getElementById('root')).render(<App/>);

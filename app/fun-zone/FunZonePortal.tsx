"use client";
import {useEffect,useLayoutEffect,useRef,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "@/components/PodscapeLineIcon";
import {WorkspaceEditBlock,WorkspaceEditToolbar,useWorkspaceDrag} from "@/components/WorkspaceEditCanvas";
import {dropBlock,moveBlock,uniqueAllowed,visibleBlocks} from "@/components/workspace-layout";
import {useWorkspaceEditorDialog} from "@/components/useWorkspaceEditorDialog";
import {ARCADE_CATEGORIES,ARCADE_GAMES,ARCADE_GAME_KEYS,ARCADE_LAYOUT_KEY,GAME_FAVOURITES_KEY,categoryCounts,normaliseFavourites,type ArcadeCategory,type ArcadeGame} from "@/lib/fun-zone-arcade";
import {FunZoneCarousel} from "./FunZoneCarousel";
import {PodExchangeWatchlist} from "./PodExchangeWatchlist";
import styles from "./fun-zone-portal.module.css";
import homeEditStyles from "@/components/PodscapeHome.module.css";

type CoreWidget="featured"|"categories"|"favourites"|"progress"|"exchange";
type WidgetKey=CoreWidget|`game:${string}`;
type SavedLayout={order:WidgetKey[];visible:WidgetKey[]};
const defaultOrder:WidgetKey[]=["featured","categories","favourites","progress","exchange",...ARCADE_GAME_KEYS.map(key=>`game:${key}` as const)];
const defaultVisible:WidgetKey[]=["featured","categories","favourites","progress"];
const widgetNames:Record<CoreWidget,string>={featured:"Featured Games",categories:"Game Categories",favourites:"My Favourite Games",progress:"My Play Progress",exchange:"Duck Bucks Watchlist"};
const widgetIcons:Record<CoreWidget,PodscapeIconName>={featured:"gamepad",categories:"grid",favourites:"bookmark",progress:"achievement",exchange:"gamepad"};
function label(id:WidgetKey):string{return id.startsWith("game:")?ARCADE_GAMES.find(game=>game.key===id.slice(5))?.title||id:widgetNames[id as CoreWidget];}
function icon(id:WidgetKey):PodscapeIconName{return id.startsWith("game:")?ARCADE_GAMES.find(game=>game.key===id.slice(5))?.icon||"gamepad":widgetIcons[id as CoreWidget];}
function readStored<T>(key:string,fallback:T):T{
 try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback;}catch{return fallback;}
}
function readLayout(key:string):SavedLayout{
 const value=readStored<Partial<SavedLayout>|null>(key,null);
 if(!value||!Array.isArray(value.order)||!Array.isArray(value.visible))return {order:[...defaultOrder],visible:[...defaultVisible]};
 const order=uniqueAllowed(value.order,defaultOrder);
 const visible=uniqueAllowed(value.visible,defaultOrder);
 return {order:[...order,...defaultOrder.filter(id=>!order.includes(id))],visible};
}
function GameCard({game,isFavourite,onToggle,compact=false}:{game:ArcadeGame;isFavourite:boolean;onToggle:(key:string)=>void;compact?:boolean}){
 return <article className={`${styles.gameCard} ${compact?styles.compactGame:""}`}>
  <span className={styles.gameIcon} aria-hidden="true"><PodscapeLineIcon name={game.icon}/></span>
  <div className={styles.gameInfo}>
   <span className={styles.gameType}>{game.category}{game.beta?" · BETA":""}</span>
   <h3><Link href={game.href}>{game.title}</Link></h3>
   {!compact?<p>{game.description}</p>:null}
  </div>
  <div className={styles.gameActions}>
   <button type="button" onClick={()=>onToggle(game.key)} aria-label={isFavourite?`Remove ${game.title} from favourites`:`Add ${game.title} to favourites`} aria-pressed={isFavourite} title={isFavourite?"Remove favourite":"Add favourite"}>{isFavourite?"♥":"♡"}</button>
   <Link href={game.href} aria-label={`Play ${game.title}`}>→</Link>
  </div>
 </article>;
}
export function FunZonePortal({userId,completedByGame,trackingAvailable,exp,coins}:{userId:string|null;completedByGame:Record<string,number>;trackingAvailable:boolean;exp:number;coins:number;}){
 const scopeKey=userId||"guest";
 const layoutKey=ARCADE_LAYOUT_KEY+":"+scopeKey;
 const favoritesKey=GAME_FAVOURITES_KEY+":"+scopeKey;
 const [layout,setLayout]=useState<SavedLayout>({order:[...defaultOrder],visible:[...defaultVisible]});
 const [favourites,setFavourites]=useState<string[]>([]);
 const [hydrated,setHydrated]=useState(false);
 const [category,setCategory]=useState<ArcadeCategory>("Word Games");
 const [editing,setEditing]=useState(false);
 const [libraryOpen,setLibraryOpen]=useState(false);
 const dialogRef=useWorkspaceEditorDialog(libraryOpen,()=>setLibraryOpen(false));
 const editAnchor=useRef<{id:WidgetKey;top:number}|null>(null);
 const enterCanvas=(id?:WidgetKey)=>{
  if(id){
   const block=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="fun-zone"]')).find(node=>node.dataset.workspaceBlock===id);
   editAnchor.current=block?{id,top:block.getBoundingClientRect().top}:null;
  }else editAnchor.current=null;
  setLibraryOpen(false);
  setEditing(true);
 };
 useLayoutEffect(()=>{
  if(!editing||!editAnchor.current)return;
  const {id,top}=editAnchor.current;
  editAnchor.current=null;
  const block=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="fun-zone"]')).find(node=>node.dataset.workspaceBlock===id);
  if(!block)return;
  const delta=block.getBoundingClientRect().top-top;
  if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:"instant"});
 },[editing]);
 const finishCanvas=()=>{stopDrag();editAnchor.current=null;setEditing(false)};
 useEffect(()=>{
  setLayout(readLayout(layoutKey));
  setFavourites(normaliseFavourites(readStored<unknown>(favoritesKey,[])));
  setHydrated(true);
 },[layoutKey,favoritesKey]);
 const saveLayout=(next:SavedLayout)=>{
  setLayout(next);
  try{localStorage.setItem(layoutKey,JSON.stringify(next));}catch{/* Local-only beta */}
 };
 const toggleFavourite=(key:string)=>{
  const next=favourites.includes(key)?favourites.filter(id=>id!==key):[...favourites,key];
  setFavourites(next);
  try{localStorage.setItem(favoritesKey,JSON.stringify(next));}catch{/* Local-only beta */}
 };
 const add=(id:WidgetKey)=>saveLayout({order:layout.order.includes(id)?layout.order:[...layout.order,id],visible:[...layout.visible.filter(x=>x!==id),id]});
 const remove=(id:WidgetKey)=>saveLayout({...layout,visible:layout.visible.filter(x=>x!==id)});
 const reset=()=>{
  if(!window.confirm("Reset your Fun Zone layout? Favourite games and puzzle progress will stay safe."))return;
  stopDrag();saveLayout({order:[...defaultOrder],visible:[...defaultVisible]});
 };
 const active=visibleBlocks(layout.order,layout.visible);
 const reorder=(from:WidgetKey,to:WidgetKey)=>saveLayout({...layout,order:dropBlock(layout.order,from,to)});
 const {dragging,begin:beginDrag,move:moveDrag,stop:stopDrag}=useWorkspaceDrag<WidgetKey>("fun-zone",active,reorder);
 const move=(id:WidgetKey,dir:number)=>saveLayout({...layout,order:moveBlock(layout.order,layout.visible,id,dir)});
 const favouriteGames=favourites.flatMap(key=>{const game=ARCADE_GAMES.find(g=>g.key===key);return game?[game]:[]});
 const done=Object.values(completedByGame).reduce((sum,n)=>sum+n,0);
 const renderWidget=(id:WidgetKey)=>{
  if(id==="featured")return <FunZoneCarousel signedIn={Boolean(userId)} exp={exp} coins={coins}/>;
  if(id==="categories")return <section className={styles.card} aria-label="Game categories">
   <div className={styles.blockTitle}><div><span className={styles.eyebrow}>GAME LIBRARY</span><h2>Choose your adventure.</h2></div><span className={styles.subtle}>{ARCADE_GAMES.length} games</span></div>
   <div className={styles.categoryGrid}>{ARCADE_CATEGORIES.map(item=><button key={item} type="button" aria-pressed={category===item} onClick={()=>setCategory(item)}>
    <span className={styles.categoryIcon}><PodscapeLineIcon name={item==="Word Games"?"letters":item==="Puzzles & Logic"?"connections":item==="Trivia & Knowledge"?"quiz":item==="Simulations"?"gamepad":"podbound"}/></span>
    <strong>{item}</strong><small>{categoryCounts[item]} {categoryCounts[item]===1?"game":"games"}</small>
   </button>)}</div>
   <div className={styles.categoryListing}><div className={styles.categoryHeading}><h3>{category}</h3><span>{categoryCounts[category]} available</span></div>
    {ARCADE_GAMES.filter(game=>game.category===category).length?ARCADE_GAMES.filter(game=>game.category===category).map(game=><GameCard key={game.key} game={game} isFavourite={favourites.includes(game.key)} onToggle={toggleFavourite}/>):<p className={styles.empty}>More games are coming to this category.</p>}
   </div>
  </section>;
  if(id==="favourites")return <section className={styles.card} aria-label="Your favourite games"><div className={styles.blockTitle}><div><span className={styles.eyebrow}>YOUR ARCADE</span><h2>My Favourite Games</h2></div><span className={styles.subtle}>{favouriteGames.length} saved</span></div>
    {favouriteGames.length?<div className={styles.favouritesGrid}>{favouriteGames.map(game=><GameCard key={game.key} game={game} compact isFavourite onToggle={toggleFavourite}/>)}</div>:<p className={styles.empty}>Tap ♡ beside a game to save it here. Favourite games stay separate from your puzzle progress.</p>}
   </section>;
  if(id==="progress")return <section className={styles.card} aria-label="Game progress"><div className={styles.blockTitle}><div><span className={styles.eyebrow}>PLAY & PROGRESS</span><h2>My Play Progress</h2></div><PodscapeLineIcon name="achievement"/></div>
   <div className={styles.statGrid}><div><strong>{userId?exp.toLocaleString("en-CA"):"—"}</strong><small>EXP earned</small></div><div><strong>{userId?coins.toLocaleString("en-CA"):"—"}</strong><small>Pod Coins (separate)</small></div><div><strong>{trackingAvailable?done:"—"}</strong><small>Puzzle completions</small></div></div>
   <div className={styles.inlineLinks}><Link href="/account/progress">Achievements →</Link><Link href="/fun-zone/leaderboard">Leaderboards →</Link></div>
  </section>;
  if(id==="exchange")return <PodExchangeWatchlist/>;
  if(id.startsWith("game:")){
   const game=ARCADE_GAMES.find(g=>g.key===id.slice(5));
   return game?<section className={styles.card} aria-label={game.title}><div className={styles.blockTitle}><div><span className={styles.eyebrow}>PINNED GAME</span><h2>{game.title}</h2></div><PodscapeLineIcon name={game.icon}/></div><p className={styles.pinnedDescription}>{game.description}</p><div className={styles.inlineLinks}><Link href={game.href}>Play {game.title} →</Link><button type="button" onClick={()=>toggleFavourite(game.key)}>{favourites.includes(game.key)?"♥ Favourite":"♡ Favourite"}</button></div></section>:null;
  }
  return null;
 };
 return <div className={`${styles.portal} ${editing?homeEditStyles.homeCanvasEditing:""}`} data-workspace-root="fun-zone" onPointerMove={e=>{if(editing)moveDrag(e)}} onPointerUp={()=>{if(editing)stopDrag()}} onPointerCancel={()=>{if(editing)stopDrag()}}>
  <header className={styles.hero}><div><span className={styles.heroEyebrow}>PODSCAPE / FUN ZONE</span><h1>Your little arcade.</h1><p>Your favourite games, your layout. Find a puzzle, chase a high score or spend some Duck Bucks.</p></div><button type="button" className={styles.editButton} onClick={()=>editing?finishCanvas():enterCanvas()}><PodscapeLineIcon name={editing?"check":"edit"}/>{editing?"Done":"Customize"}</button></header>
  <nav className={styles.quickLinks} aria-label="Fun Zone shortcuts"><a href="#arcade-games"><PodscapeLineIcon name="grid"/> Categories</a><a href="#arcade-favourites"><PodscapeLineIcon name="bookmark"/> My Games</a><Link href="/fun-zone/leaderboard"><PodscapeLineIcon name="trophy"/> Rankings</Link><Link href="/fun-zone/pod-exchange"><PodscapeLineIcon name="gamepad"/> Pod Exchange</Link></nav>
  {editing?<WorkspaceEditToolbar title="Arrange Fun Zone" description="Drag the handles or use arrows to reorder games and widgets." onAdd={()=>{finishCanvas();setLibraryOpen(true)}} onReset={reset} onDone={finishCanvas}/>:null}
  <div className={styles.widgets}>{active.map((id,i)=><div key={id} id={id==="categories"?"arcade-games":id==="favourites"?"arcade-favourites":undefined}><WorkspaceEditBlock id={id} scope="fun-zone" label={label(id)} index={i} count={active.length} editing={editing} dragging={dragging===id} required={false} onMove={move} onRemove={remove} begin={beginDrag} move={moveDrag} stop={stopDrag} onLongPress={()=>enterCanvas(id)}>{renderWidget(id)}</WorkspaceEditBlock></div>)}</div>
  {hydrated&&!editing?<button className={styles.addWidget} type="button" onClick={()=>setLibraryOpen(true)}><PodscapeLineIcon name="grid"/> Add Widgets & Games</button>:null}
  {libraryOpen?<div className={styles.overlay} onPointerDown={event=>{if(event.target===event.currentTarget)setLibraryOpen(false)}}><section className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="arcade-widget-title"><header><div><span className={styles.eyebrow}>YOUR ARCADE · YOUR WAY</span><h2 id="arcade-widget-title">Widget Library</h2></div><button type="button" onClick={()=>setLibraryOpen(false)}>Done</button></header><p>Pin games, categories, progress, or the market watchlist. Everything saves to this device.</p><button type="button" className={styles.arrangeLink} onClick={()=>{setLibraryOpen(false);enterCanvas()}}>Arrange Fun Zone →</button>
   <h3>Arcade widgets</h3><div className={styles.libraryGrid}>{(["featured","categories","favourites","progress","exchange"] as CoreWidget[]).map(id=><div key={id} className={styles.libraryCard}><PodscapeLineIcon name={icon(id)}/><strong>{label(id)}</strong><button type="button" aria-pressed={layout.visible.includes(id)} onClick={()=>layout.visible.includes(id)?remove(id):add(id)}>{layout.visible.includes(id)?"✓ Added · Remove":"+ Add Widget"}</button></div>)}</div>
   <h3>Pin a game</h3><div className={styles.libraryGrid}>{ARCADE_GAMES.map(game=>{const id=`game:${game.key}` as WidgetKey;return <div key={id} className={styles.libraryCard}><PodscapeLineIcon name={game.icon}/><strong>{game.title}</strong><small>{game.category}</small><button type="button" aria-pressed={layout.visible.includes(id)} onClick={()=>layout.visible.includes(id)?remove(id):add(id)}>{layout.visible.includes(id)?"✓ Added · Remove":"+ Add Game"}</button></div>})}</div>
  </section></div>:null}
  <p className={styles.note}>Customizations and favourites currently save on this device. Existing game routes, achievements and completions are unchanged.</p>
 </div>;
}

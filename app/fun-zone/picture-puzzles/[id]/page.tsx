import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getPicturePuzzle,listPicturePuzzles,picturePuzzleImage} from "@/lib/picture-puzzles";
import {PlatformShell} from "@/components/PlatformShell";
import {customerSupabase} from "@/lib/customer-auth/server";
import {PicturePuzzleBoard} from "../PicturePuzzleBoard";
import styles from "../picture-puzzles.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Play Picture Puzzle | PodScape Fun Zone",robots:{index:false,follow:false}};
export default async function PicturePuzzlePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const puzzle=await getPicturePuzzle(id);
 if(!puzzle||puzzle.status!=="published"&&!await isAdminAuthenticated())notFound();
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const owner=await isAdminAuthenticated();
 let nextHref:string|undefined;
 if(puzzle.status==="published"){
  if(!db||!user)redirect("/account/login");
  const [listing,result]=await Promise.all([
   listPicturePuzzles(),
   db.from("member_puzzle_completions").select("puzzle_id").eq("user_id",user.id).eq("game_key","picture-puzzles")
  ]);
  if(!listing||result.error)redirect("/fun-zone/picture-puzzles");
  const index=listing.findIndex(p=>p.id===id);
  const completed=new Set((result.data||[]).map(p=>String(p.puzzle_id)));
  if(index<0||index>0&&!completed.has(id)&&!completed.has(listing[index-1].id)&&!owner)
   redirect("/fun-zone/picture-puzzles");
  const next=listing[index+1];if(next)nextHref="/fun-zone/picture-puzzles/"+next.id;
 }
 const url=picturePuzzleImage(puzzle.image_path);
 if(!url)notFound();
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href="/fun-zone/picture-puzzles">← All picture puzzles</Link>
  {puzzle.status!=="published"?<p className={styles.empty}>OWNER PREVIEW · This draft is not visible to players.</p>:null}
  <PicturePuzzleBoard userId={user?.id||"owner-preview"} id={puzzle.id} title={puzzle.title} description={puzzle.description} imageAlt={puzzle.image_alt} learningNote={puzzle.learning_note} imageUrl={url} difficulty={puzzle.difficulty} puzzleType={puzzle.puzzle_type} level={puzzle.level} rewardsEnabled={puzzle.status==="published"} nextHref={nextHref}/>
 </div></main></PlatformShell>;
}

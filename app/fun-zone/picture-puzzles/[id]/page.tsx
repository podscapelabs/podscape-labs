import Link from "next/link";
import {notFound} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getPicturePuzzle,picturePuzzleImage} from "@/lib/picture-puzzles";
import {PlatformShell} from "@/components/PlatformShell";
import {PicturePuzzleBoard} from "../PicturePuzzleBoard";
import styles from "../picture-puzzles.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Play Picture Puzzle | PodScape Fun Zone",robots:{index:false,follow:false}};
export default async function PicturePuzzlePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const puzzle=await getPicturePuzzle(id);
 if(!puzzle||puzzle.status!=="published"&&!await isAdminAuthenticated())notFound();
 const url=picturePuzzleImage(puzzle.image_path);
 if(!url)notFound();
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href="/fun-zone/picture-puzzles">← All picture puzzles</Link>
  {puzzle.status!=="published"?<p className={styles.empty}>OWNER PREVIEW · This draft is not visible to players.</p>:null}
  <PicturePuzzleBoard id={puzzle.id} title={puzzle.title} description={puzzle.description} imageAlt={puzzle.image_alt} learningNote={puzzle.learning_note} imageUrl={url} difficulty={puzzle.difficulty} puzzleType={puzzle.puzzle_type} level={puzzle.level}/>
 </div></main></PlatformShell>;
}

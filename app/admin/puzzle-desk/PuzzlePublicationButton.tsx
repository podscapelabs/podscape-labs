"use client";
export function PuzzlePublicationButton({published}:{published:boolean}){
 return <button type="submit" onClick={event=>{
  const question=published
   ?"Unpublish this puzzle? It will disappear from the Fun Zone until you publish it again."
   :"Publish this puzzle to the Fun Zone? Members will be able to play it and earn progress.";
  if(!window.confirm(question))event.preventDefault();
 }}>{published?"Unpublish":"Publish"}</button>;
}

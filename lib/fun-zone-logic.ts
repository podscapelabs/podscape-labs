export type LetterResult="correct"|"present"|"absent";
export function scoreWordGuess(guess:string,target:string):LetterResult[]{
 if(guess.length!==target.length)throw new Error("Word length mismatch");
 const result:Array<LetterResult>=Array(target.length).fill("absent");
 const available=new Map<string,number>();
 for(let i=0;i<target.length;i++){
  if(guess[i]===target[i])result[i]="correct";
  else available.set(target[i],(available.get(target[i])||0)+1);
 }
 for(let i=0;i<guess.length;i++)if(result[i]!=="correct"){
  const count=available.get(guess[i])||0;
  if(count>0){result[i]="present";available.set(guess[i],count-1);}
 }
 return result;
}
export type WordSearchPoint={r:number;c:number};
const directions=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]] as const;
export function makeWordSearchPuzzle(words:readonly string[],size:number,initialSeed:number){
 const grid=Array.from({length:size},()=>Array.from({length:size},()=> ""));
 const locations:Record<string,string[]>={};
 let seed=initialSeed;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(const word of [...words].sort((a,b)=>b.length-a.length)){
  let placed=false;
  for(let attempt=0;attempt<10000&&!placed;attempt++){
   const [dr,dc]=directions[Math.floor(random()*directions.length)];
   const r=Math.floor(random()*size),c=Math.floor(random()*size);
   const cells=Array.from({length:word.length},(_,i)=>({r:r+i*dr,c:c+i*dc}));
   if(cells.some((p,i)=>p.r<0||p.c<0||p.r>=size||p.c>=size||(grid[p.r][p.c]!==""&&grid[p.r][p.c]!==word[i])))continue;
   cells.forEach((p,i)=>grid[p.r][p.c]=word[i]);
   locations[word]=cells.map(p=>p.r+"-"+p.c);placed=true;
  }
  if(!placed)throw new Error("Puzzle placement failed for "+word);
 }
 const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
 grid.forEach(row=>row.forEach((v,i)=>{if(!v)row[i]=letters[Math.floor(random()*letters.length)]}));
 return {grid,locations};
}

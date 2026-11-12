export function nextBinName(speciesName:string,existingNames:string[]){
 const used=new Set(existingNames.map(name=>name.trim().toLowerCase()));
 const prefix=speciesName.trim().slice(0,60)||"New";
 for(let n=1;n<=existingNames.length+1;n++){
  const candidate=prefix+" · Bin "+String(n).padStart(2,"0");
  if(!used.has(candidate.toLowerCase()))return candidate;
 }
 return prefix+" · Bin "+String(existingNames.length+1);
}

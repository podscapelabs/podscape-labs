export type CollectionView="active"|"saved"|"archived";
type Bin={speciesId:string;isArchived:boolean};
export function resolveCollectionView(requested:string|undefined,focus:string|undefined,bins:Bin[]):CollectionView{
 if(requested==="active"||requested==="saved"||requested==="archived")return requested;
 if(focus&&!bins.some(bin=>bin.speciesId===focus&&!bin.isArchived)){
  return bins.some(bin=>bin.speciesId===focus)?"archived":"saved";
 }
 return "active";
}
export function speciesMatchesCollectionView(id:string,view:CollectionView,saved:ReadonlySet<string>,bins:Bin[]){
 if(view==="saved")return saved.has(id)&&!bins.some(bin=>bin.speciesId===id);
 return bins.some(bin=>bin.speciesId===id&&bin.isArchived===(view==="archived"));
}

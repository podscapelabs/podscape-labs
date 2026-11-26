/** Use the same complete active-bin order in the picker and both navigation controls. */
export function orderCareBins(bins) {
 return [...bins].sort((a,b)=>a.species.localeCompare(b.species)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
export function nextCareBinId(bins,currentId) {
 const index=bins.findIndex(bin=>bin.id===currentId);
 return index<0||bins.length<2?undefined:bins[(index+1)%bins.length].id;
}

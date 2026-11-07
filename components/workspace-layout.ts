/** Shared, pure layout operations for Home and Manager.
 * Keep required blocks in the order model; visibility applies only to optional blocks.
 */
export function visibleBlocks<T extends string>(order:readonly T[], visible:readonly T[], required:readonly T[]=[]):T[]{
  return order.filter(id=>required.includes(id)||visible.includes(id));
}
export function moveBlock<T extends string>(order:readonly T[], visible:readonly T[], id:T, delta:number, required:readonly T[]=[]):T[]{
  const active=visibleBlocks(order,visible,required);
  const current=active.indexOf(id),destination=current+delta;
  if(current<0||destination<0||destination>=active.length)return [...order];
  const result=[...order],a=result.indexOf(id),b=result.indexOf(active[destination]);
  [result[a],result[b]]=[result[b],result[a]];
  return result;
}
export function dropBlock<T extends string>(order:readonly T[],source:T,target:T):T[]{
  if(source===target||!order.includes(source)||!order.includes(target))return [...order];
  const result=[...order];
  result.splice(result.indexOf(source),1);
  result.splice(result.indexOf(target),0,source);
  return result;
}
export function uniqueAllowed<T extends string>(ids:readonly unknown[],allowed:readonly T[]):T[]{
  return [...new Set(ids.filter((id):id is T=>typeof id==="string"&&allowed.includes(id as T)))];
}

export function orderCareBins<T extends {id:string;species:string;name:string}>(bins:readonly T[]):T[];
export function nextCareBinId(bins:readonly {id:string}[],currentId:string):string|undefined;

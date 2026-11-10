import type {PodscapeIconName} from "@/components/PodscapeLineIcon";

/** Shared update taxonomy for dashboard cards, announcements and Owner Studio. */
export const updateCategories=[
 {id:"leaf_ledger",label:"Leaf Ledger",icon:"leaf",plural:"species"},
 {id:"whats_improved",label:"What's Improved",icon:"creative",plural:"improvements"},
 {id:"new_features",label:"New Features",icon:"grid",plural:"features"},
 {id:"field_guide",label:"Field Guide",icon:"book",plural:"guides"},
 {id:"shop_vendors",label:"Shop & Vendors",icon:"shop",plural:"updates"},
 {id:"fun_podbound",label:"Fun Zone & PodBound",icon:"gamepad",plural:"updates"}
] as const satisfies readonly {id:string;label:string;icon:PodscapeIconName;plural:string}[];
export type UpdateCategory=(typeof updateCategories)[number]["id"];
export const updateCategoryById=Object.fromEntries(updateCategories.map(c=>[c.id,c])) as Record<UpdateCategory,(typeof updateCategories)[number]>;

/** Shared session-only navigation context for the Leaf Ledger.
 * No species data or account information is persisted here.
 */
export const LEDGER_EXPLORER_STATE_KEY="podscape-ledger-explorer-v1";
export const LEDGER_BROWSE_ORDER_KEY="podscape-ledger-browse-order-v1";

export type LedgerExplorerSnapshot={
 query:string;
 genus:string;
 organism?:"all"|"isopod"|"springtail";
 care:string;
 sort:"catalogue"|"common"|"scientific"|"recent";
 filtersOpen:boolean;
 scrollY:number;
};
export type LedgerBrowseOrder={
 slugs:string[];
};

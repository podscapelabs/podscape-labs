import {redirect} from "next/navigation";

// Market ranking eligibility is verified automatically against the server trade ledger.
// Retain the old Owner Studio URL as a redirect, not an approval workflow.
export default function MarketInvestorReviews(){
 redirect("/fun-zone/pod-exchange/rankings");
}

import { redirect } from "next/navigation";
export default async function LegacySpeciesRecord({ params }: { params: Promise<{ slug: string }> }) { redirect(`/ledger/${(await params).slug}`); }

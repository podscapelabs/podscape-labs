import {redirect} from "next/navigation";

/** Legacy studio landing has been superseded by the published update archive.
 * Individual /from-the-lab/[slug] studio articles stay available at their URLs.
 */
export default function LegacyLabLanding(){
 redirect("/updates");
}

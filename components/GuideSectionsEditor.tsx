"use client";

import { useState } from "react";
import type { GuideSection } from "@/data/guides";

function newSection(): GuideSection {
  return { id: `section-${crypto.randomUUID()}`, heading: "", body: "" };
}

export function GuideSectionsEditor({ initialSections, bodyPlaceholder = "Write the studio-reviewed guide material here.", addLabel = "+ Add article section" }: { initialSections: GuideSection[]; bodyPlaceholder?: string; addLabel?: string }) {
  const [sections, setSections] = useState(initialSections.length ? initialSections : [newSection()]);

  function updateSection(index: number, field: "heading" | "body", value: string) {
    setSections((current) => current.map((section, sectionIndex) => sectionIndex === index ? { ...section, [field]: value } : section));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= sections.length) return;
    setSections((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  return <div className="admin-guide-sections">
    <input type="hidden" name="sections" value={JSON.stringify(sections)} />
    {sections.map((section, index) => <section key={section.id}>
      <header><strong>Section {String(index + 1).padStart(2, "0")}</strong><div><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={`Move section ${index + 1} up`}>↑</button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} aria-label={`Move section ${index + 1} down`}>↓</button><button type="button" onClick={() => setSections((current) => current.filter((_, sectionIndex) => sectionIndex !== index))} disabled={sections.length === 1}>Remove</button></div></header>
      <label><span>Section heading</span><input value={section.heading} onChange={(event) => updateSection(index, "heading", event.target.value)} placeholder="A clear, useful heading" /></label>
      <label><span>Section body</span><textarea value={section.body} onChange={(event) => updateSection(index, "body", event.target.value)} rows={8} placeholder={bodyPlaceholder} /></label>
    </section>)}
    <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,margin:"12px 0"}}>
      <button className="button button-outline" type="button" onClick={() => setSections((current) => [...current, newSection()])}>{addLabel}</button>
      <button className="button button-outline" type="button" onClick={() => setSections(current=>[...current,{...newSection(),heading:"Materials and setup"}])}>+ Setup section</button>
      <button className="button button-outline" type="button" onClick={() => setSections(current=>[...current,{...newSection(),heading:"Care and maintenance"}])}>+ Care section</button>
      <button className="button button-outline" type="button" onClick={() => setSections(current=>[...current,{...newSection(),heading:"Common questions"}])}>+ FAQ section</button>
    </div>
  </div>;
}

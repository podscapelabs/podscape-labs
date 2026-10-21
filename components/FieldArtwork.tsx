export type FieldIconName = "leaf" | "jar" | "bag" | "store" | "palette" | "people" | "pet" | "cards" | "book" | "flask" | "home" | "grid";

const paths: Record<FieldIconName, string> = {
  leaf: "M4 20C2 9 9 3 21 3c0 12-6 19-17 17Zm0 0L17 7M9 15v-5m0 5h5",
  jar: "M8 3h8v3H8zM7 6h10l2 3v11H5V9l2-3Zm-2 5h14M9 17c0-4 6-4 6 0M10 13v-2m4 2v-2",
  bag: "M4 8h16l-2 13H6L4 8Zm4 2V6a4 4 0 0 1 8 0v4M10 13v4m4-4v4",
  store: "M3 10l3-6h12l3 6M4 10v10h16V10M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0M9 20v-6h6v6",
  palette: "M12 3a9 9 0 1 0 0 18h2c3 0 3-3 1-4s0-3 2-3h2c4-5-1-11-7-11ZM7 9h.1M11 6h.1M16 7h.1M6 14h.1",
  people: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a3 3 0 1 0 0-6M2 20v-3a6 6 0 0 1 12 0v3H2Zm14-7a5 5 0 0 1 6 5v2h-5",
  pet: "M5 16c-4-7 3-13 7-13s11 6 7 13M6 11h12M8 7h8M4 15l-2 2m4 1-2 3m14-3 2 3m0-6 2 2M8 16h.1m8 0h.1M9 19q3 2 6 0",
  cards: "M8 3h12v17H8zM4 5l-2 1 4 16 7-2M12 8l4 4-4 4-1-4 1-4Z",
  book: "M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Zm3 4 3 1m6 0 3-1",
  flask: "M9 3h6m-5 0v6L4 19c-1 2 1 2 2 2h12c1 0 3 0 2-2L14 9V3M7 15h10M10 18h.1m4-1h.1",
  home: "M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10",
  grid: "M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4zM15 15h5v5h-5z",
};

export function FieldIcon({ name }: { name: FieldIconName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export type StudyVariant = "cow" | "papaya" | "panda" | "clown";
const palettes: Record<StudyVariant, [string, string]> = {
  cow: ["#e2d7b5", "#28352c"],
  papaya: ["#cb8046", "#75472e"],
  panda: ["#484c52", "#e0c9a1"],
  clown: ["#9c5939", "#edc577"],
};

export function IsopodStudy({ variant }: { variant: StudyVariant }) {
  const [shell, spots] = palettes[variant];
  return (
    <svg className="isopod-study" viewBox="0 0 480 320" aria-hidden="true">
      <g className="study-botanical" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M23 282C62 201 68 118 43 37M44 63C6 46 7 26 15 12c26 9 35 28 29 51Zm11 47c-40-7-43-26-40-41 28 2 40 14 40 41Zm3 53c-37-1-46-20-47-34 27-5 46 10 47 34Zm-6 53c-34 7-49-10-51-23 27-12 44-4 51 23ZM36 258c30 2 50-10 53-33-24-4-45 12-53 33ZM54 193c30-1 48-20 47-41-27 1-45 17-47 41ZM59 137c26-5 37-24 31-43-24 4-33 22-31 43M390 311c19-48 39-82 74-102m-56 62c-22-26-18-45-4-58 19 14 22 33 4 58Zm17-25c29 13 47 3 54-15-22-9-41-1-54 15Z" />
        <ellipse cx="253" cy="279" rx="150" ry="9" opacity=".25" />
      </g>
      <g transform="translate(88 72) rotate(-12 150 100)" stroke="#30382c" strokeWidth="2" strokeLinejoin="round">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={`legs-${i}`} d={`M${55 + i * 28} 129l-13 30-16 8M${55 + i * 28} 77l-11-26-12-8`} fill="none" />)}
        <path d="M26 110C25 43 250 21 277 99c10 29-17 63-68 69C112 181 29 159 26 110Z" fill={shell} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <g key={i}>
            <path d={`M${61 + i * 27} ${67 - Math.sin(i / 6 * Math.PI) * 17}q29 44 2 ${91 + Math.sin(i / 6 * Math.PI) * 12}`} fill="none" />
            <ellipse cx={72 + i * 27} cy={91 - Math.sin(i / 6 * Math.PI) * 15} rx={6} ry={10} fill={spots} stroke="none" />
            <ellipse cx={72 + i * 27} cy={137 + Math.sin(i / 6 * Math.PI) * 6} rx={5} ry={7} fill={spots} stroke="none" />
            <path d={`M${72 + i * 27} 111h5`} stroke={spots} strokeWidth="4" />
          </g>
        ))}
        <path d="M29 92C7 82 10 65 1 62M32 111C8 116 7 132-3 134" fill="none" />
        <circle cx="36" cy="95" r="3" fill="#20261d" />
      </g>
    </svg>
  );
}

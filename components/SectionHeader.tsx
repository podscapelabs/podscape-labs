type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  body?: string;
  light?: boolean;
};

export function SectionHeader({ eyebrow, title, body, light = false }: SectionHeaderProps) {
  return (
    <div className={`section-header${light ? " section-header-light" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <div className="section-header-grid">
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
    </div>
  );
}

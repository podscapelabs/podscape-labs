type PageHeaderProps = {
  eyebrow: string;
  title: string;
  body: string;
  marker?: string;
};

export function PageHeader({ eyebrow, title, body, marker = "Field archive" }: PageHeaderProps) {
  return (
    <header className="page-header shell-wide">
      <div className="page-header-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      <div className="page-header-specimen" aria-hidden="true">
        <span className="page-header-leaf"><b>PDX</b></span>
        <small>{marker}</small>
      </div>
    </header>
  );
}

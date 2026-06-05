type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
}: PageIntroProps): React.JSX.Element {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {eyebrow}
      </p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

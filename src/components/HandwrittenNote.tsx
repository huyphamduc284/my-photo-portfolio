type HandwrittenNoteProps = {
  children: string;
  className?: string;
};

export default function HandwrittenNote({
  children,
  className = "",
}: HandwrittenNoteProps) {
  return (
    <p
      className={`font-hand text-[1.15rem] leading-snug text-text-secondary whitespace-pre-line ${className}`}
    >
      {children}
    </p>
  );
}

interface DnaMarkProps {
  size?: number;
}

export default function DnaMark({ size = 16 }: DnaMarkProps) {
  const stroke = Math.max(1.4, size * 0.1);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4C11 7 13 17 18 20"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M18 4C13 7 11 17 6 20"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path d="M8 7H16" stroke="currentColor" strokeWidth={stroke - 0.4} strokeLinecap="round" />
      <path d="M7.2 12H16.8" stroke="currentColor" strokeWidth={stroke - 0.4} strokeLinecap="round" />
      <path d="M8 17H16" stroke="currentColor" strokeWidth={stroke - 0.4} strokeLinecap="round" />
    </svg>
  );
}

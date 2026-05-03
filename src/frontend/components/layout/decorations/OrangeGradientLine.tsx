interface Props {
  className?: string;
}

export default function OrangeGradientLine({ className }: Props) {
  return (
    <div
      className={`tw:h-1 tw:w-full tw:bg-linear-to-r tw:from-primary-dark tw:from-10% tw:via-primary tw:to-primary-dark tw:to-90% ${className ?? ""}`}
    />
  );
}

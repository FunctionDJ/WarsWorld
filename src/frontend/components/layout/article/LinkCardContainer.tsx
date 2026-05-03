interface Props {
  children: React.ReactNode;
}

export default function LinkCardContainer({ children }: Props) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:desktop:gap-8 tw:justify-center tw:items-center tw:my-4 tw:smallscreen:grid tw:smallscreen:grid-flow-row tw:smallscreen:grid-cols-2 tw:desktop:grid-cols-3 tw:monitor:grid-cols-4 tw:large_monitor:grid-cols-5">
      {children}
    </div>
  );
}

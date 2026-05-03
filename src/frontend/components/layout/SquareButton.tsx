interface Props {
  disabled?: boolean;
  onClick?: React.MouseEventHandler;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset" | undefined;
}

export default function SquareButton({ disabled, onClick, children, type }: Props) {
  return (
    <button
      className={`@rounded @w-full @h-full @py-1 @px-3 cellphone:@px-4 @text-inherit @font-semibold @shadow-black/50 @shadow-md ${
        disabled === undefined || !disabled
          ? "tw:bg-primary tw:hover:scale-[1.025] tw:active:scale-105"
          : "tw:bg-primary-dark"
      } active:@bg-primary-dark`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

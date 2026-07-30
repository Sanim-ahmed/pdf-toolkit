interface SuccessMessageProps {
  children?: React.ReactNode;
}

export default function SuccessMessage({ children }: SuccessMessageProps) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
      <span className="mr-1.5">&#10003;</span>
      Conversion completed successfully.
      {children}
    </div>
  );
}

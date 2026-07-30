interface ErrorMessageProps {
  error: string;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div
      className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
      role="alert"
    >
      {error}
    </div>
  );
}

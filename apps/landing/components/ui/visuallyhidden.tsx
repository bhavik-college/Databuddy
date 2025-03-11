export default function VisuallyHidden({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className="sr-only">
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils";

/**
 * Wrapper con larghezza massima e padding orizzontale coerenti.
 * Da usare all'interno di ogni sezione per allineare i contenuti.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}
      {...props}
    />
  );
}

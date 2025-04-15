import { cn } from "@/lib/utils"
import { memo } from "react"

const Skeleton = memo(function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
});

Skeleton.displayName = "Skeleton";

export { Skeleton }


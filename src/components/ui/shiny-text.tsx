import { CSSProperties, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText: FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 3,
  className,
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent bg-gradient-to-r bg-[length:var(--shimmer-width)_100%] bg-[position:calc(-100%-var(--shimmer-width))_0]",
        !disabled && "animate-shiny-text",
        className
      )}
      style={
        {
          "--shimmer-width": "200px",
          animationDuration,
          backgroundImage: "var(--gradient-primary)",
        } as CSSProperties
      }
    >
      {text}
    </span>
  );
};

export default ShinyText;

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
        "inline-block bg-clip-text text-transparent bg-gradient-to-r bg-[length:200%_100%] bg-[position:200%_0]",
        !disabled && "animate-shiny-text",
        className
      )}
      style={
        {
          animationDuration,
          backgroundImage: "linear-gradient(90deg, hsl(16 100% 50%) 0%, hsl(22 100% 58%) 30%, hsl(25 100% 60%) 50%, hsl(22 100% 58%) 70%, hsl(16 100% 50%) 100%)",
        } as CSSProperties
      }
    >
      {text}
    </span>
  );
};

export default ShinyText;

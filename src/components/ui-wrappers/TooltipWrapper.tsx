import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";

export interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Standardized tooltip wrapper following shadcn patterns.
 * Provides consistent tooltip behavior with customizable positioning.
 *
 * @example
 * <TooltipWrapper content="Click to edit" side="top">
 *   <Button>Edit</Button>
 * </TooltipWrapper>
 */
export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  content,
  children,
  side = "top",
  sideOffset = 4,
  className,
  disabled = false,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={sideOffset}
          className={className}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

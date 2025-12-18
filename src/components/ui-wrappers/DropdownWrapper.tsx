import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";
import { Link } from "react-router-dom";

export interface DropdownAction {
  label: string;
  onClick: () => void;
  type?: "button" | "link" | "function";
  href?: string;
  disabled?: boolean;
  className?: string;
}

export interface DropdownWrapperProps {
  trigger: React.ReactNode;
  actions: DropdownAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  tooltipContent?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  className?: string;
  contentClassName?: string;
}

/**
 * Standardized dropdown wrapper following shadcn patterns.
 * Provides consistent dropdown behavior with tooltip support and action management.
 *
 * @example
 * <DropdownWrapper
 *   trigger={<Button>Options</Button>}
 *   actions={[
 *     { label: "Edit", onClick: () => handleEdit() },
 *     { label: "Delete", onClick: () => handleDelete(), className: "text-destructive" }
 *   ]}
 *   tooltipContent="Course Options"
 * />
 */
export const DropdownWrapper: React.FC<DropdownWrapperProps> = ({
  trigger,
  actions,
  open,
  onOpenChange,
  align = "end",
  side = "bottom",
  sideOffset = 4,
  tooltipContent,
  tooltipSide = "top",
  className,
  contentClassName,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      {tooltipContent ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild className={className}>
                {trigger}
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DropdownMenuTrigger asChild className={className}>
          {trigger}
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={contentClassName}
      >
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.className}
            asChild={action.type === "link" && action.href ? true : undefined}
          >
            {action.type === "link" && action.href ? (
              <Link to={action.href} className="no-underline">
                {action.label}
              </Link>
            ) : (
              action.label
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

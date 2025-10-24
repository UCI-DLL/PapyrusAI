import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ButtonProps } from "../ui/button";

export interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export interface DialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: DialogAction[];
  contentClassName?: string;
  footerClassName?: string;
  showFooter?: boolean;
}

/**
 * Standardized dialog wrapper following shadcn patterns.
 * Provides consistent dialog structure with customizable content and actions.
 *
 * @example
 * // Simple confirmation dialog
 * <DialogWrapper
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete File?"
 *   description="Are you sure you want to delete this file?"
 *   actions={[
 *     { label: "Cancel", onClick: () => setOpen(false), variant: "outline" },
 *     { label: "Delete", onClick: handleDelete, variant: "destructive" }
 *   ]}
 * />
 *
 * @example
 * // Dialog with custom content
 * <DialogWrapper
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Select Folder"
 *   description="Choose a folder to copy the file to"
 *   contentClassName="max-w-2xl"
 *   actions={[
 *     { label: "Cancel", onClick: () => setOpen(false), variant: "outline" }
 *   ]}
 * >
 *   <div className="max-h-96 overflow-y-auto">
 *     <FolderList />
 *   </div>
 * </DialogWrapper>
 */
export const DialogWrapper: React.FC<DialogWrapperProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  contentClassName,
  footerClassName,
  showFooter = true,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        {showFooter && actions && actions.length > 0 && (
          <DialogFooter className={footerClassName}>
            {actions.map((action, index) => (
              <Button
                key={index}
                type={action.type || "button"}
                variant={action.variant || "default"}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

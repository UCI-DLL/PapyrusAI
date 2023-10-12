import clsx from "clsx";
import { useState } from "react";
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

type VariantOptions = "primary" | "secondary";
type FontSizeOptions = "sm" | "md" | "lg";

interface CheckboxProps {
  [key: string]: any;
  children?: string | JSX.Element;
  className?: string;
  checked?: boolean;
  variant?: VariantOptions;
  isDisabled?: boolean;
  isEvent?: boolean;
  fontSize?: FontSizeOptions;
  id?: string;
  hasError?: boolean;
  errorMessage?: string;
  uncheckedIcon?: string;
  checkedIcon?: string;
}

export function Checkbox({
  children,
  className,
  checked = false,
  variant = "primary",
  isDisabled = false,
  isEvent = false,
  fontSize = "md",
  id = Math.random().toString(),
  hasError = false,
  errorMessage,
  uncheckedIcon = "uncheckedCheckbox",
  checkedIcon = "checkbox",
  ...props
}: CheckboxProps) {
  const classes = clsx("c-checkbox", className, {
    [`-${variant}`]: variant,
    [`-font-size-${fontSize}`]: fontSize,
  });
  const checkmark_classes = clsx("c-checkbox__checkmark", className, {
    [`-${variant}`]: variant,
    [`-isDisabled`]: isDisabled,
    "c-checkbox__has-error": hasError,
  });

  const [isChecked, setChecked] = useState(false);
  const toggleCheck = () => setChecked((prev) => !prev);

  return (
    <>
      <div
        className={classes}
        onClick={() => {
          if (!isDisabled) {
            if (isEvent) {
              toggleCheck();
            } else if (props.onClick) {
              props.onClick();
            }
          }
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={isEvent ? isChecked : checked}
          onChange={() => {}}
          {...props}
        />
        <label
          className={`c-checkbox__label ${
            isDisabled ? "c-checkbox__label--isDisabled" : ""
          }`}
        >
          {children}
        </label>
        <span
          className={`${checkmark_classes} ${
            checked || isChecked ? "" : "c-checkbox--is-unchecked"
          }`}
        >
          {checked ? 
          <CheckBoxIcon color="primary" sx={{height: "100%", width: "100%"}} /> : 
          <CheckBoxOutlineBlankIcon color="primary" sx={{height: "100%", width: "100%"}}/>
          }
        </span>
      </div>
      {hasError && errorMessage !== "" && (
        <div className="c-checkbox__error-message">{errorMessage}</div>
      )}
    </>
  );
}

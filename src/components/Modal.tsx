import React, { useEffect } from "react";
import clsx from "clsx";
import ReactModal from "react-modal";
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  className?: string;
  children?: JSX.Element;
  title?: string;
  actions?: JSX.Element;
  overlayClassName?: string;
  appElement?: string;
  onRequestClose: (e: React.MouseEvent<HTMLElement>) => void;
  hideClose?: boolean;
  [key: string]: any;
}

/**
 * @param {ModalProps}
 * @returns {JSX.Element}
 */
export function Modal({
  children = <></>,
  className = "",
  title,
  actions,
  overlayClassName = "",
  appElement = "#root",
  onRequestClose,
  hideClose = false, //hides the close button
  ...props
}: ModalProps): JSX.Element {
  const classes = clsx("c-modal", className);
  const overlayClasses = clsx("c-modal__overlay", overlayClassName);

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    onRequestClose(event);
  }

  useEffect(() => {
    ReactModal.setAppElement(appElement);
  }, [appElement]);

  return (
    <ReactModal
      className={classes}
      overlayClassName={overlayClasses}
      onRequestClose={onRequestClose}
      isOpen
      appElement={document.getElementById('root') || undefined}
      {...props}
    >
      {!hideClose && (
        <button
          aria-label="Close modal"
          className="c-modal__close"
          onClick={handleClick}
        >
          <CloseIcon />
        </button>
      )}

      {title && <h2 className="c-modal__title">{title}</h2>}

      <div className="c-modal__body">{children}</div>

      {actions && <footer className="c-modal__footer">{actions}</footer>}
    </ReactModal>
  );
}

import React, { useContext, useEffect, useCallback } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navigation from "../features/navigation/Navigation";
import { UserType } from "./types/UserTypes";
import { AlertContext, AlertType } from "./context/AlertContext";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

/**
 * Show the appropriate screens if the user is logged in
 * @returns
 */

interface props {
    user: UserType | null;
}

const Alert = ({
    severity,
    children,
    onClose,
}: {
    severity: AlertType;
    children: React.ReactNode;
    onClose: () => void;
}) => {
    const { t } = useTranslation();
    const bgColor =
        severity === "error"
            ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-800 dark:text-red-200 colorful-dark:bg-red-900 colorful-dark:border-red-800 colorful-dark:text-red-200"
            : severity === "warning"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200 colorful-dark:bg-yellow-900 colorful-dark:border-yellow-800 colorful-dark:text-yellow-200"
                : severity === "success"
                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-200  colorful-dark:bg-green-900 colorful-dark:border-green-800 colorful-dark:text-green-200"
                    : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-200  colorful-dark:bg-blue-900 colorful-dark:border-blue-800 colorful-dark:text-blue-200";

    const getIcon = (type: AlertType) => {
        const iconClass = "h-5 w-5 flex-shrink-0";
        switch (type) {
            case "success":
                return <CheckCircle className={iconClass} />;
            case "error":
                return <AlertCircle className={iconClass} />;
            case "warning":
                return <AlertTriangle className={iconClass} />;
            case "info":
            default:
                return <Info className={iconClass} />;
        }
    };

    // Auto-dismiss after 30 seconds
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 30000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={`border rounded-md p-4 mb-4 ${bgColor} flex items-start gap-3`}
        >
            {getIcon(severity)}
            <div className="flex-1">{children}</div>
            <button
                onClick={onClose}
                className="flex-shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 colorful-dark:hover:bg-white/10 transition-colors"
                aria-label={t("common.close")}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};

export function PrivateRoute({ user }: props): JSX.Element {
    const { alert, setAlert } = useContext(AlertContext);

    const handleCloseAlert = useCallback(() => {
        setAlert({ message: "", type: "info" });
    }, [setAlert]);

    useEffect(() => {
        //When the page changes, reset the alert
        setAlert({ message: "", type: "info" });

        // eslint-disable-next-line
    }, []);

    return localStorage.getItem("papyrusai_access_token") ? (
        <Navigation>
            <div className="flex flex-col h-full">
                {alert.message !== "" && (
                    <div className="p-4">
                        <Alert severity={alert.type} onClose={handleCloseAlert}>
                            {alert.message}
                        </Alert>
                    </div>
                )}
                <div className="flex-1">
                    <Outlet />
                </div>
            </div>
        </Navigation>
    ) : (
        <Navigate to={"/login"} />
    );
}

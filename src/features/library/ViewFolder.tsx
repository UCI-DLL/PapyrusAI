import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { FolderType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { UserContext } from "../../utility/context/UserContext";
import {
    getOrgFolder,
    getUserFolder,
} from "../../utility/endpoints/FolderEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import {
    Plus,
    MessageSquare,
    FileText,
    Folder,
} from "lucide-react";
import ListFolderContents from "./ListFolderContents";

export enum SortOptions {
    Ascending = "Ascending",
    Descending = "Descending",
    Newest = "Newest",
    Oldest = "Oldest",
}

export default function ViewFolder(): JSX.Element {
    let location = useLocation();
    let navigator = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [folder, setFolder] = useState<FolderType>();
    const { user } = useContext(UserContext);
    const { setAlert } = useContext(AlertContext);
    const [activeTab, setActiveTab] = useState<string>("all");

    useEffect(() => {
        const controller = new AbortController();
        //get pathname to figure out if we are editing
        if (
            location.pathname &&
            location.pathname.split("/") &&
            location.pathname.split("/")[1] &&
            location.pathname.split("/")[1] === "library" &&
            location.pathname.split("/")[2] &&
            location.pathname.split("/")[2] !== "org"
        ) {
            //get user folder data
            getFolder(
                false,
                location.pathname.split("/")[2],
                controller.signal
            );
        } else if (
            location.pathname &&
            location.pathname.split("/") &&
            location.pathname.split("/")[1] &&
            location.pathname.split("/")[1] === "library" &&
            location.pathname.split("/")[2] &&
            location.pathname.split("/")[2] === "org" &&
            location.pathname.split("/")[3]
        ) {
            //get org folder
            getFolder(true, location.pathname.split("/")[3], controller.signal);
        }

        return () => {
            controller.abort();
        };
        // eslint-disable-next-line
    }, [location.pathname]);

    function getFolder(isOrg: boolean, folderId: string, signal: AbortSignal) {
        if (!isOrg) {
            Get(getUserFolder(folderId), signal).then((res) => {
                if (res && res.status && res.status < 300) {
                    if (res.data) {
                        //also set session
                        setFolder(res.data);
                        setIsLoading(false);
                    }
                } else if (res && res.status === 401) {
                    navigator("/login");
                } else {
                    if (res === undefined) {
                    } else {
                        //handle error
                        //redirect to prompt list
                        navigator("/library");
                        setAlert({
                            message: "Folder Does Not Exist",
                            type: "error",
                        });
                        setIsLoading(false);
                    }
                }
            });
        } else {
            Get(getOrgFolder(folderId), signal).then((res) => {
                if (res && res.status && res.status < 300) {
                    if (res.data) {
                        //also set session
                        setFolder(res.data);
                        setIsLoading(false);
                    }
                } else if (res && res.status === 401) {
                    navigator("/login");
                } else {
                    if (res === undefined) {
                    } else {
                        //handle error
                        //redirect to prompt list
                        // navigator("/library");
                        setAlert({
                            message: "Folder Does Not Exist",
                            type: "error",
                        });
                        setIsLoading(false);
                    }
                }
            });
        }
    }

    const getTotalItems = () => {
        if (!folder) return 0;
        return (folder.prompts?.length || 0) + (folder.files?.length || 0);
    };

    const getPromptCount = () => {
        return folder?.prompts?.length || 0;
    };

    const getFileCount = () => {
        return folder?.files?.length || 0;
    };

    return !isLoading && folder ? (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {folder?.name}
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Collection of creative writing prompts for
                                various AI models and use cases
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {user?.groups.includes(
                                process.env.REACT_APP_INSTRUCTOR
                                    ? process.env.REACT_APP_INSTRUCTOR
                                    : "PapyrusAIInstructors"
                            ) && (
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        navigator(
                                            location.pathname.split("/")[2] !==
                                                "org"
                                                ? `/library/${folder.id}/createprompt` //user prompt
                                                : `/library/org/${folder.id}/createprompt`
                                        ); //is org prompt
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add Content
                                </Button>
                            )}
                        </div>
                    </div>
                </div>


                {/* Category Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activeTab === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("all")}
                        className="flex items-center gap-2"
                    >
                        <Folder className="h-4 w-4" />
                        All Items {getTotalItems()}
                    </Button>
                    <Button
                        variant={
                            activeTab === "prompts" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setActiveTab("prompts")}
                        className="flex items-center gap-2"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Prompts {getPromptCount()}
                    </Button>
                    <Button
                        variant={activeTab === "files" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("files")}
                        className="flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Files {getFileCount()}
                    </Button>
                </div>

                {/* Content */}
                <ListFolderContents
                    folderId={folder.id}
                    isOrgFolder={location.pathname.split("/")[2] === "org"}
                    activeTab={activeTab}
                />
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-gray-600">Loading folder...</p>
            </div>
        </div>
    );
}

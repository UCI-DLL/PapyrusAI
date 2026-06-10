import React, { useContext, useEffect, useRef, useState } from "react";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { LibraryItem } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Patch from "../../utility/Patch";
import Delete from "../../utility/Delete";
import {
  getItemPermissions,
  postItemPermission,
  patchItemPermission,
  deleteItemPermission,
} from "../../utility/endpoints/ItemEndpoints";
import { getUserList } from "../../utility/endpoints/UserEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import { ChevronDown, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "../../hooks/useTranslation";

interface ItemPermission {
  itemId: string;
  userId: string;
  permission: "viewer" | "editor" | "owner";
  source: "direct" | "inherited";
  inheritedFrom: string | null;
  grantedBy: string;
}

interface ShareItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LibraryItem;
}

export function ShareItemDialog({ open, onOpenChange, item }: ShareItemDialogProps) {
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const { t } = useTranslation();

  // Permissions state
  const [permissions, setPermissions] = useState<ItemPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newPermission, setNewPermission] = useState<"viewer" | "editor">("viewer");
  const [isAdding, setIsAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // User picker state
  const [users, setUsers] = useState<CustomUserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CustomUserType | null>(null);
  const usersControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      loadPermissions();
      loadAllUsers("");
    } else {
      setPermissions([]);
      setSelectedUser(null);
      setUserSearch("");
      setNewPermission("viewer");
      setUsers([]);
      setPickerOpen(false);
    }
    // eslint-disable-next-line
  }, [open]);

  function loadAllUsers(paginationToken: string) {
    if (!paginationToken) {
      usersControllerRef.current?.abort();
      usersControllerRef.current = new AbortController();
      setUsersLoading(true);
    }
    const signal = usersControllerRef.current!.signal;
    Get(getUserList(50, paginationToken), signal).then((res) => {
      if (res && res.status < 300 && res.data?.Users) {
        const page: CustomUserType[] = res.data.Users.map((u: CustomUserType) => ({
          username: u.username,
          email: u.email,
          name: u.name,
          family_name: u.family_name,
          sub: u.sub,
        }));
        setUsers((prev) => (paginationToken ? [...prev, ...page] : page));
        if (res.data.Users.length >= 50 && res.data.PaginationToken) {
          loadAllUsers(res.data.PaginationToken);
        } else {
          setUsersLoading(false);
        }
      } else {
        setUsersLoading(false);
      }
    });
  }

  function loadPermissions() {
    setIsLoading(true);
    Get(getItemPermissions(item.itemId), undefined, true).then((res) => {
      if (res && res.status < 300) {
        setPermissions(res.data ?? []);
      } else if (res?.status === 401) {
        navigator("/login");
      }
      setIsLoading(false);
    });
  }

  function handleAdd() {
    if (!selectedUser) return;
    setIsAdding(true);
    Post(
      postItemPermission(item.itemId),
      { userId: selectedUser.username, permission: newPermission },
      true
    ).then((res) => {
      if (res && res.status < 300) {
        setSelectedUser(null);
        setUserSearch("");
        setNewPermission("viewer");
        loadPermissions();
        setAlert({ message: t("library.permissionAdded"), type: "success" });
      } else if (res?.status === 401) {
        navigator("/login");
      } else {
        setAlert({
          message: res?.data?.message || t("library.failedToAddPermission"),
          type: "error",
        });
      }
      setIsAdding(false);
    });
  }

  function handleUpdate(userId: string, permission: "viewer" | "editor") {
    setUpdatingId(userId);
    Patch(patchItemPermission(item.itemId, userId), { permission }, true).then((res) => {
      if (res && res.status < 300) {
        setPermissions((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, permission } : p))
        );
        setAlert({ message: t("library.permissionUpdated"), type: "success" });
      } else if (res?.status === 401) {
        navigator("/login");
      } else {
        setAlert({
          message: res?.data?.message || t("library.failedToUpdatePermission"),
          type: "error",
        });
      }
      setUpdatingId(null);
    });
  }

  function handleDelete(userId: string) {
    setDeletingId(userId);
    Delete(deleteItemPermission(item.itemId, userId), true).then((res) => {
      if (res && res.status < 300) {
        setPermissions((prev) => prev.filter((p) => p.userId !== userId));
        setAlert({ message: t("library.permissionRemoved"), type: "success" });
      } else if (res?.status === 401) {
        navigator("/login");
      } else {
        setAlert({
          message: res?.data?.message || t("library.failedToRemovePermission"),
          type: "error",
        });
      }
      setDeletingId(null);
    });
  }

  const isEditable = (p: ItemPermission) =>
    p.source === "direct" && p.permission !== "owner";

  // Display email for a userId; fall back to the username if not found in the loaded list
  const getUserEmail = (userId: string) =>
    users.find((u) => u.username === userId)?.email ?? userId;

  const permissionedUserIds = new Set(permissions.map((p) => p.userId));

  const filteredUsers = users.filter((u) => {
    if (u.username === user?.username) return false;
    if (permissionedUserIds.has(u.username)) return false;
    const q = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.name} ${u.family_name}`.toLowerCase().includes(q)
    );
  });

  return (
    <DialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={t("library.shareItem")}
      description={`${t("library.managePermissionsFor")} "${item.name}"`}
      contentClassName="sm:max-w-lg"
      actions={[
        {
          label: t("common.close"),
          onClick: () => onOpenChange(false),
          variant: "outline",
        },
      ]}
    >
      <div className="space-y-4">
        {/* Add new user */}
        <div className="space-y-2">
          <Label>{t("library.addUser")}</Label>
          <div className="flex gap-2">
            {/* User picker */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  className="flex-1 justify-between font-normal min-w-0"
                >
                  <span className="truncate text-sm">
                    {selectedUser ? selectedUser.email : t("library.selectUser")}
                  </span>
                  {selectedUser ? (
                    <button
                      type="button"
                      className="shrink-0 ml-2 text-muted-foreground hover:text-foreground"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(null);
                        setUserSearch("");
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-2 text-muted-foreground" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
                align="start"
              >
                <div className="p-2 border-b">
                  <Input
                    placeholder={t("library.searchUsers")}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                  {usersLoading && filteredUsers.length === 0 ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-3 py-2">
                      {t("library.noUsersFound")}
                    </p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.username}
                        className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent text-sm transition-colors"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserSearch("");
                          setPickerOpen(false);
                        }}
                      >
                        <div className="font-medium">
                          {u.name} {u.family_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Permission level */}
            <Select
              value={newPermission}
              onValueChange={(v) => setNewPermission(v as "viewer" | "editor")}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{t("library.viewer")}</SelectItem>
                <SelectItem value="editor">{t("library.editor")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Add button */}
            <Button
              onClick={handleAdd}
              disabled={!selectedUser || isAdding}
              size="sm"
              aria-label={t("library.addUser")}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Current permissions list */}
        <div className="space-y-2">
          <Label>{t("library.currentPermissions")}</Label>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t("library.noPermissions")}
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {permissions.filter((p) => p.permission !== "owner").map((perm) => {
                const email = getUserEmail(perm.userId);
                return (
                  <div key={perm.userId} className="flex items-center gap-2 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{email}</div>
                      {/* Show username beneath email when they differ */}
                      {email !== perm.userId && (
                        <div className="text-xs text-muted-foreground truncate">
                          {perm.userId}
                        </div>
                      )}
                    </div>
                    {perm.source === "inherited" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {t("library.inherited")}
                      </Badge>
                    )}
                    {isEditable(perm) ? (
                      <>
                        <Select
                          value={perm.permission}
                          onValueChange={(v) =>
                            handleUpdate(perm.userId, v as "viewer" | "editor")
                          }
                          disabled={updatingId === perm.userId}
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">{t("library.viewer")}</SelectItem>
                            <SelectItem value="editor">{t("library.editor")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(perm.userId)}
                          disabled={deletingId === perm.userId}
                          aria-label={t("library.removePermission")}
                        >
                          {deletingId === perm.userId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {perm.permission}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DialogWrapper>
  );
}

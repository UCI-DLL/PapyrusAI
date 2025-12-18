import { useContext, useEffect, useState } from "react";
import Get from "../../utility/Get";
import { useNavigate } from "react-router";
import { OrgPermissionType } from "../../utility/types/OrganizationTypes";
import {
  getOrgPermissionsList,
  postCreateOrgPermission,
  updateOrgPermission,
} from "../../utility/endpoints/OrgSettingsEndpoints";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserPlus,
  Loader2,
  Users,
  Settings,
} from "lucide-react";
import Put from "../../utility/Put";
import Post from "../../utility/Post";
import { AlertContext } from "../../utility/context/AlertContext";
import { useTranslation } from "../../hooks/useTranslation";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";

export enum PermissionsOptions {
  // Admin = "Admin",
  Instructor = "Instructor",
  None = "None",
}

export default function OrgSettings(): JSX.Element {
  let navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const [orgPermissionsList, setOrgPermissionsList] = useState<
    Array<OrgPermissionType>
  >([]); //org permissions list
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [showAddOrgPermissionModal, setShowAddOrgPermissionModal] = useState<{
    open: boolean;
    email: string;
    permission: string;
  }>({
    open: false,
    email: "",
    permission: "None",
  });
  const [showUpdateOrgPermissionModal, setShowUpdateOrgPermissionModal] =
    useState<{
      //update permission modal
      id: string; //email
      permission: string;
    }>({
      id: "",
      permission: "None",
    });
  const [openDeleteModal, setOpenDeleteModal] = useState<
    OrgPermissionType | undefined
  >(undefined);
  const [filter, setFilter] = useState<{
    search: string;
  }>({
    search: "", //email
  });
  const [filteredOrgPermissionList, setFilteredOrgPermissionList] = useState<
    Array<OrgPermissionType>
  >([]);
  //If safari, use a different dropdown within dialog modal so that screen readers can read
  const isSafari =
    typeof window !== "undefined" &&
    window.navigator.userAgent.includes("Safari") &&
    !window.navigator.userAgent.includes("Chrome") &&
    window.navigator.userAgent.includes("Mac OS");

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddOrgPermissionModal.open && orgPermissionsList.length === 0) {
      setIsLoading(true);
      getOrgPermissions("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [showAddOrgPermissionModal]);

  function getOrgPermissions(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getOrgPermissionsList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (
          res.data &&
          res.data.permission &&
          res.data.ScannedCount !== undefined
        ) {
          //Get the list of all permissions
          setOrgPermissionsList((prev) => [...prev, ...res.data.permission]);
          setFilteredOrgPermissionList((prev) => [
            ...prev,
            ...res.data.permission,
          ]);

          //if the data is 20 permissions, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getOrgPermissions(res.data.LastEvaluatedKey.id, signal);
          } else {
            setIsLoading(false);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setError(t("orgSettings.noPermissionsFound"));
          setIsLoading(false);
        }
      }
    });
  }

  useEffect(() => {
    var filteredList = orgPermissionsList;

    //handle search
    if (filter.search !== "") {
      filteredList = filteredList.filter((permission) =>
        permission.id.toLowerCase().includes(filter.search.toLowerCase())
      );
    }
    //handle sort
    filteredList = filteredList.sort((a, b) =>
      b.isAdmin ? 1 : a.isInstructor ? -1 : 0
    );
    //then set filtered list
    setFilteredOrgPermissionList(filteredList);
  }, [filter, orgPermissionsList]);

  function handleSearchOrgPermissionList(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    e.preventDefault();
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  }

  function clearFilters() {
    setFilter({
      search: "",
    });
    setFilteredOrgPermissionList(orgPermissionsList);
  }

  function addPermission(e: React.FormEvent) {
    e.preventDefault();
    if (showAddOrgPermissionModal.permission === PermissionsOptions.None) {
      setAlert({ message: t("orgSettings.noPermissionsGiven"), type: "info" });
      setShowAddOrgPermissionModal({
        open: false,
        email: "",
        permission: "None",
      });
    }
    //add permissions
    if (showAddOrgPermissionModal.email === "") {
      setAlert({ message: t("orgSettings.missingEmail"), type: "error" });
      setShowAddOrgPermissionModal({
        open: false,
        email: "",
        permission: "None",
      });
    } else {
      // set is loading
      setIsLoading(true);
      const dataToSend = {
        //if admin, then admin and instructor permissions
        isAdmin: false,
        isInstructor:
          showAddOrgPermissionModal.permission ===
          PermissionsOptions.Instructor,
        id: showAddOrgPermissionModal.email.toLowerCase(),
      };
      // post data back
      Post(postCreateOrgPermission(), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => [...prev, res.data]);
            //pop up notifying user of creation
            setAlert({ message: t("orgSettings.permissionAdded"), type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({ message: res.data, type: "error" });
        }
        // set is loading back
        setIsLoading(false);
        setShowAddOrgPermissionModal({
          open: false,
          email: "",
          permission: "None",
        });
      });
    }
  }

  function updatePermission(e: React.FormEvent) {
    e.preventDefault();
    //if permissions is none, then open delete modal
    if (showUpdateOrgPermissionModal.permission === PermissionsOptions.None) {
      setShowUpdateOrgPermissionModal({
        id: "",
        permission: "",
      });
      setOpenDeleteModal({
        id: showUpdateOrgPermissionModal.id,
        isAdmin: false,
        isInstructor: false,
        organization: process.env.REACT_APP_ORGANIZATION ?? "",
      });
    } else {
      // set is loading
      setIsLoading(true);
      const dataToSend = {
        //if admin, then admin and instructor permissions
        isAdmin: false,
        isInstructor:
          showUpdateOrgPermissionModal.permission ===
          PermissionsOptions.Instructor,
        id: showUpdateOrgPermissionModal.id.toLowerCase(),
        isDeleted: false,
      };
      // post data back
      Put(
        updateOrgPermission(showUpdateOrgPermissionModal.id.toLowerCase()),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => {
              const index = prev.findIndex(
                (x) => x.id === showUpdateOrgPermissionModal.id.toLowerCase()
              );
              const newList = prev;
              newList[index] = res.data;
              return newList;
            });
            //pop up notifying user of creation
            setAlert({ message: t("orgSettings.permissionUpdated"), type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({ message: res.data, type: "error" });
        }
        // set is loading back
        setIsLoading(false);
        //then close modal
        setShowUpdateOrgPermissionModal({
          id: "",
          permission: "",
        });
      });
    }
  }

  function handleDelete() {
    // handle delete
    if (openDeleteModal) {
      // set is loading
      setIsLoading(true);
      const dataToSend = {
        //if admin, then admin and instructor permissions
        isAdmin: openDeleteModal.isAdmin,
        isInstructor: openDeleteModal.isInstructor,
        id: openDeleteModal.id.toLowerCase(),
        isDeleted: true,
      };
      // post data back
      Put(
        updateOrgPermission(openDeleteModal.id.toLowerCase()),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => {
              const newList = prev.filter(
                (x) => x.id !== openDeleteModal.id.toLowerCase()
              );
              return newList;
            });
            //pop up notifying user of creation
            setAlert({ message: t("orgSettings.permissionRemoved"), type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({ message: res.data, type: "error" });
        }
        // set is loading back
        setIsLoading(false);
        //then close modal
        setOpenDeleteModal(undefined);
      });
    } else {
      setAlert({
        message: t("orgSettings.somethingWentWrong"),
        type: "error",
      });
    }
  }

  return !isLoading ? (
    <main className="bg-background text-foreground p-4 space-y-6">
      {error ? (
        <div
          className="bg-destructive/15 border border-destructive rounded-lg p-4"
          role="alert"
        >
          <p className="text-destructive font-medium text-center">{error}</p>
        </div>
      ) : (
        <>
          {/* Add Permission Modal */}
          <DialogWrapper
            open={showAddOrgPermissionModal.open}
            onOpenChange={(open) => {
              if (!open) {
                setShowAddOrgPermissionModal({
                  open: false,
                  email: "",
                  permission: "None",
                });
              }
            }}
            title={t("orgSettings.addNewPermissions")}
            description={t("orgSettings.addPermissionsDescription")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: t("common.cancel"),
                onClick: () =>
                  setShowAddOrgPermissionModal({
                    open: false,
                    email: "",
                    permission: "None",
                  }),
                variant: "outline",
              },
              {
                label: isLoading ? t("orgSettings.adding") : t("orgSettings.addPermission"),
                onClick: () => {
                  const fakeEvent = {
                    preventDefault: () => { },
                  } as React.FormEvent;
                  addPermission(fakeEvent);
                },
                disabled: isLoading,
              },
            ]}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("orgSettings.emailAddress")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={showAddOrgPermissionModal.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShowAddOrgPermissionModal((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const fakeEvent = {
                        preventDefault: () => { },
                      } as React.FormEvent;
                      addPermission(fakeEvent);
                    }
                  }}
                />
              </div>
              {isSafari ? (
                <div className="space-y-2">
                  <Label htmlFor="permission-level">{t("orgSettings.permissionLevel")}</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={showAddOrgPermissionModal.permission}
                    onChange={(value) => {
                      setShowAddOrgPermissionModal((prev) => ({
                        ...prev,
                        permission: value.target.value,
                      }));
                    }}
                    title={t("orgSettings.permissionLevel")}
                  >
                    {Object.keys(PermissionsOptions).map((key) => (
                      <option value={key} key={key} className="capitalize">
                        {t(`common.${key.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="permission-level">{t("orgSettings.permissionLevel")}</Label>
                  <Select
                    value={showAddOrgPermissionModal.permission}
                    onValueChange={(value) => {
                      setShowAddOrgPermissionModal((prev) => ({
                        ...prev,
                        permission: value,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("orgSettings.selectPermissionLevel")} />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} position="popper">
                      {Object.keys(PermissionsOptions).map((key) => (
                        <SelectItem value={key} key={key} className="capitalize">
                          {t(`common.${key.toLowerCase()}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogWrapper>

          {/* Delete Permission Modal */}
          <DialogWrapper
            open={openDeleteModal !== undefined}
            onOpenChange={(open) => {
              if (!open) setOpenDeleteModal(undefined);
            }}
            title={t("orgSettings.removeAllPermissions")}
            description={t("orgSettings.removePermissionsDescription")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: t("common.cancel"),
                onClick: () => setOpenDeleteModal(undefined),
                variant: "outline",
              },
              {
                label: t("orgSettings.removePermissions"),
                onClick: handleDelete,
                variant: "destructive",
              },
            ]}
          >
            <div className="py-4">
              <p>
                {t("orgSettings.removePermissionsConfirm", { email: openDeleteModal?.id })}
              </p>
            </div>
          </DialogWrapper>

          {/* Update Permission Modal */}
          <DialogWrapper
            open={showUpdateOrgPermissionModal.id !== ""}
            onOpenChange={(open) => {
              if (!open) {
                setShowUpdateOrgPermissionModal({
                  id: "",
                  permission: "",
                });
              }
            }}
            title={t("orgSettings.updatePermissions")}
            description={t("orgSettings.updatePermissionDescription")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: t("common.cancel"),
                onClick: () =>
                  setShowUpdateOrgPermissionModal({
                    id: "",
                    permission: "",
                  }),
                variant: "outline",
              },
              {
                label: isLoading ? t("orgSettings.updating") : t("orgSettings.updatePermission"),
                onClick: () => {
                  const fakeEvent = {
                    preventDefault: () => { },
                  } as React.FormEvent;
                  updatePermission(fakeEvent);
                },
                disabled: isLoading,
              },
            ]}
          >
            <div className="space-y-4">
              <div className="py-2">
                <p>
                  {t("orgSettings.updatePermissionsFor", { email: showUpdateOrgPermissionModal.id })}
                </p>
              </div>
              {isSafari ? (
                <div className="space-y-2">
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={showUpdateOrgPermissionModal.permission}
                    onChange={(value) => {
                      setShowUpdateOrgPermissionModal((prev) => ({
                        ...prev,
                        permission: value.target.value,
                      }));
                    }}
                    title={t("orgSettings.permissionLevel")}
                  >
                    {Object.keys(PermissionsOptions).map((key) => (
                      <option value={key} key={key} className="capitalize">
                        {t(`common.${key.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="update-permission-level">
                    {t("orgSettings.permissionLevel")}
                  </Label>
                  <Select
                    value={showUpdateOrgPermissionModal.permission}
                    onValueChange={(value) => {
                      setShowUpdateOrgPermissionModal((prev) => ({
                        ...prev,
                        permission: value,
                      }));
                    }}
                    dir="ltr"
                    defaultOpen={false}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("orgSettings.selectPermissionLevel")} />
                    </SelectTrigger>
                    <SelectContent aria-label={`${t("orgSettings.selectPermissionLevel")} ${t("common.moreOptions")}`} avoidCollisions={false} position="popper">
                      {Object.keys(PermissionsOptions).map((key) => (
                        <SelectItem value={key} key={key} className="capitalize">
                          {t(`common.${key.toLowerCase()}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            </div>
          </DialogWrapper>

          {/* Standard Page Header Pattern */}
          <header className="animate-in slide-in-from-bottom-4 duration-700">
            <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
              <div
                className="absolute top-0 right-0 w-48 h-48 opacity-10"
                aria-hidden="true"
              >
                <Settings size={192} className="text-primary" />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                    {t("orgSettings.organizationSettings")}
                  </h1>
                  <nav
                    className="flex flex-col md:flex-row gap-2"
                    aria-label={`${t("orgSettings.permissionLevel")} ${t("common.actions")}}`}
                  >
                    <Button
                      onClick={() =>
                        setShowAddOrgPermissionModal((prev) => ({
                          ...prev,
                          open: true,
                        }))
                      }
                      className="flex items-center gap-2"
                      aria-label={`${t("orgSettings.addPermission")}}`}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      {t("orgSettings.addPermission")}
                    </Button>
                  </nav>
                </div>

                <p className="text-muted-foreground max-w-2xl text-base leading-6">
                  {t("orgSettings.orgSettingsDescription")}
                </p>
              </div>
            </div>
          </header>

          {/* Content Section */}
          <section aria-labelledby="permissions-content">
            <Card className="transition-all duration-300 hover:shadow-md" id="permissions-content">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      placeholder={t("orgSettings.searchByEmail")}
                      value={filter.search}
                      onChange={handleSearchOrgPermissionList}
                      className="pl-10"
                      aria-label={t("orgSettings.searchByEmail")}
                    />
                  </div>
                  <Button variant="outline" onClick={clearFilters}>
                    {t("orgSettings.clearFilters")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("orgSettings.emailAddress")}</TableHead>
                        <TableHead className="text-right">
                          {t("orgSettings.accessLevel")}
                        </TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrgPermissionList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                              <p className="text-muted-foreground">
                                {t("orgSettings.noUsersFound")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {filter.search
                                  ? t("orgSettings.tryAdjustingSearch")
                                  : t("orgSettings.addPermissionsToGetStarted")}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrgPermissionList.map((permission, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {permission.isAdmin ? (
                                <span className="flex items-center gap-2">
                                  <ShieldCheck
                                    className="h-4 w-4 text-primary"
                                    aria-hidden="true"
                                  />
                                  {permission.id}
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    setShowUpdateOrgPermissionModal({
                                      id: permission.id,
                                      permission: permission.isAdmin
                                        ? "Admin"
                                        : permission.isInstructor
                                          ? "Instructor"
                                          : "None",
                                    })
                                  }
                                  className="flex items-center gap-2 hover:text-primary transition-colors duration-200"
                                  aria-label={`${t("orgSettings.updatePermissions")} ${permission.id}`}
                                >
                                  <Shield
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  {permission.id}
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {permission.isAdmin ? (
                                <Badge variant="default" className="bg-primary pointer-events-none">
                                  {t("common.admin")}
                                </Badge>
                              ) : permission.isInstructor ? (
                                <Badge variant="secondary" className="pointer-events-none">{t("common.instructor")}</Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground pointer-events-none"
                                >
                                  <ShieldX
                                    className="mr-1 h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  {t("orgSettings.noAccess")}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!permission.isAdmin && (
                                  <>
                                    <TooltipWrapper content={t("orgSettings.updatePermissions")}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setShowUpdateOrgPermissionModal({
                                            id: permission.id,
                                            permission: permission.isAdmin
                                              ? "Admin"
                                              : permission.isInstructor
                                                ? "Instructor"
                                                : "None",
                                          })
                                        }
                                        aria-label={`${t("orgSettings.updatePermissions")} ${permission.id}`}
                                      >
                                        <Shield
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        />
                                      </Button>

                                    </TooltipWrapper>

                                    <TooltipWrapper content={t("orgSettings.removePermissions")}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setOpenDeleteModal(permission)
                                        }
                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        aria-label={`${t("orgSettings.removePermissions")} ${permission.id}`}
                                      >
                                        <Trash2
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        />
                                      </Button>
                                    </TooltipWrapper>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  ) : (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">{t("orgSettings.loadingOrgSettings")}</p>
      </div>
    </div>
  );
}

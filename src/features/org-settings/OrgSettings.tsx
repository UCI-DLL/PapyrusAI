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

export enum PermissionsOptions {
  // Admin = "Admin",
  Instructor = "Instructor",
  None = "None",
}

export default function OrgSettings(): JSX.Element {
  let navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
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
          setError("No Permissions Found");
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
      setAlert({ message: "No Permissions Given", type: "info" });
      setShowAddOrgPermissionModal({
        open: false,
        email: "",
        permission: "None",
      });
    }
    //add permissions
    if (showAddOrgPermissionModal.email === "") {
      setAlert({ message: "Missing Email", type: "error" });
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
            setAlert({ message: "Permission added", type: "success" });
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
            setAlert({ message: "Permission updated", type: "success" });
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
            setAlert({ message: "Permission removed", type: "success" });
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
        message: "Something went wrong. Please contact support.",
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
            title="Add New Permissions"
            description="Grant permission access to a user by entering their email address."
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: "Cancel",
                onClick: () =>
                  setShowAddOrgPermissionModal({
                    open: false,
                    email: "",
                    permission: "None",
                  }),
                variant: "outline",
              },
              {
                label: isLoading ? "Adding..." : "Add Permission",
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
                <Label htmlFor="email">Email Address</Label>
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

              <div className="space-y-2">
                <Label htmlFor="permission-level">Permission Level</Label>
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
                    <SelectValue placeholder="Select permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PermissionsOptions).map((key) => (
                      <SelectItem value={key} key={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogWrapper>

          {/* Delete Permission Modal */}
          <DialogWrapper
            open={openDeleteModal !== undefined}
            onOpenChange={(open) => {
              if (!open) setOpenDeleteModal(undefined);
            }}
            title="Remove All Permissions?"
            description="This action cannot be undone. The user will lose all elevated permissions."
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: "Cancel",
                onClick: () => setOpenDeleteModal(undefined),
                variant: "outline",
              },
              {
                label: "Remove Permissions",
                onClick: handleDelete,
                variant: "destructive",
              },
            ]}
          >
            <div className="py-4">
              <p>
                Are you sure you would like to remove permissions from{" "}
                <span className="font-medium">{openDeleteModal?.id}</span>? They
                will still have student level access.
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
            title="Update Permissions"
            description="Change the permission level for this user."
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: "Cancel",
                onClick: () =>
                  setShowUpdateOrgPermissionModal({
                    id: "",
                    permission: "",
                  }),
                variant: "outline",
              },
              {
                label: isLoading ? "Updating..." : "Update Permission",
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
                  Update permissions for{" "}
                  <span className="font-medium">
                    {showUpdateOrgPermissionModal.id}
                  </span>
                  ?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-permission-level">
                  Permission Level
                </Label>
                <Select
                  value={showUpdateOrgPermissionModal.permission}
                  onValueChange={(value) => {
                    setShowUpdateOrgPermissionModal((prev) => ({
                      ...prev,
                      permission: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PermissionsOptions).map((key) => (
                      <SelectItem value={key} key={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    Organization Settings
                  </h1>
                  <nav
                    className="flex flex-col md:flex-row gap-2"
                    aria-label="Permission actions"
                  >
                    <Button
                      onClick={() =>
                        setShowAddOrgPermissionModal((prev) => ({
                          ...prev,
                          open: true,
                        }))
                      }
                      className="flex items-center gap-2"
                      aria-label="Add new user permission"
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      Add Permission
                    </Button>
                  </nav>
                </div>

                <p className="text-muted-foreground max-w-2xl text-base leading-6">
                  Manage user permissions and access levels for your
                  organization.
                </p>
              </div>
            </div>
          </header>

          {/* Content Section */}
          <section aria-labelledby="permissions-content">
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      placeholder="Search by email address..."
                      value={filter.search}
                      onChange={handleSearchOrgPermissionList}
                      className="pl-10"
                      aria-label="Search users by email"
                    />
                  </div>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email Address</TableHead>
                        <TableHead className="text-right">
                          Access Level
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrgPermissionList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                              <p className="text-muted-foreground">
                                No users found
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {filter.search
                                  ? "Try adjusting your search"
                                  : "Add permissions to get started"}
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
                                  aria-label={`Update permissions for ${permission.id}`}
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
                                  Admin
                                </Badge>
                              ) : permission.isInstructor ? (
                                <Badge variant="secondary" className="pointer-events-none">Instructor</Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground pointer-events-none"
                                >
                                  <ShieldX
                                    className="mr-1 h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  No Access
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!permission.isAdmin && (
                                  <>
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
                                      aria-label={`Edit permissions for ${permission.id}`}
                                    >
                                      <Shield
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setOpenDeleteModal(permission)
                                      }
                                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                      aria-label={`Remove permissions for ${permission.id}`}
                                    >
                                      <Trash2
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      />
                                    </Button>
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
        <p className="text-muted-foreground">Loading Organization Settings</p>
      </div>
    </div>
  );
}

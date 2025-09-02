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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
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
        id: showAddOrgPermissionModal.email,
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
        id: showUpdateOrgPermissionModal.id,
        isDeleted: false,
      };
      // post data back
      Put(
        updateOrgPermission(showUpdateOrgPermissionModal.id),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => {
              const index = prev.findIndex(
                (x) => x.id === showUpdateOrgPermissionModal.id
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
        id: openDeleteModal.id,
        isDeleted: true,
      };
      // post data back
      Put(updateOrgPermission(openDeleteModal.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => {
              const newList = prev.filter((x) => x.id !== openDeleteModal.id);
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
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">{error}</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Add Permission Modal */}
          <Dialog
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
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Permissions
                </DialogTitle>
                <DialogDescription>
                  Grant permission access to a user by entering their email
                  address.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={addPermission} className="space-y-4">
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
                    disabled={isLoading}
                    required
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

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setShowAddOrgPermissionModal({
                        open: false,
                        email: "",
                        permission: "None",
                      })
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Permission
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Permission Modal */}
          <Dialog
            open={openDeleteModal !== undefined}
            onOpenChange={(open) => {
              if (!open) setOpenDeleteModal(undefined);
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldX className="h-5 w-5 text-destructive" />
                  Remove All Permissions?
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. The user will lose all elevated
                  permissions.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <p>
                  Are you sure you would like to remove permissions from{" "}
                  <span className="font-medium">{openDeleteModal?.id}</span>?
                  They will still have student level access.
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenDeleteModal(undefined)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Permissions
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Update Permission Modal */}
          <Dialog
            open={showUpdateOrgPermissionModal.id !== ""}
            onOpenChange={(open) => {
              if (!open) {
                setShowUpdateOrgPermissionModal({
                  id: "",
                  permission: "",
                });
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Update Permissions
                </DialogTitle>
                <DialogDescription>
                  Change the permission level for this user.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={updatePermission} className="space-y-4">
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

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setShowUpdateOrgPermissionModal({
                        id: "",
                        permission: "",
                      })
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Permission
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Header Section */}
          <header className="slide-in-up">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Settings className="h-6 w-6" />
                      Organization Settings
                    </CardTitle>
                    <p className="text-muted-foreground text-sm mt-2">
                      Manage user permissions and access levels for your
                      organization.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      setShowAddOrgPermissionModal((prev) => ({
                        ...prev,
                        open: true,
                      }))
                    }
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Permission
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </header>

          {/* Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                <Users className="h-5 w-5" />
                User Permissions ({filteredOrgPermissionList.length})
              </CardTitle>
              <CardDescription>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email address..."
                      value={filter.search}
                      onChange={handleSearchOrgPermissionList}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email Address</TableHead>
                      <TableHead className="text-right">Access Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrgPermissionList.map((permission, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {permission.isAdmin ? (
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-primary" />
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
                              className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                              <Shield className="h-4 w-4" />
                              {permission.id}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {permission.isAdmin ? (
                            <Badge variant="default" className="bg-primary">
                              Admin
                            </Badge>
                          ) : permission.isInstructor ? (
                            <Badge variant="secondary">Instructor</Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              <ShieldX className="mr-1 h-3 w-3" />
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
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setOpenDeleteModal(permission)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, Users } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";

interface User {
  _id: string;
  name: string;
  email: string;
  admin: boolean;
  role: "admin" | "accounting" | "logistics" | "user";
  profileImage: string;
}

const RolesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>(
    {}
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    admin: false,
  });

  const ROLES = {
    admin: t("admin-roles.roles.admin"),
    accounting: t("admin-roles.roles.accounting"),
    logistics: t("admin-roles.roles.logistics"),
    user: t("admin-roles.roles.user"),
  };

  const ROLE_DESCRIPTIONS = {
    admin: t("admin-roles.roleDescriptions.admin"),
    accounting: t("admin-roles.roleDescriptions.accounting"),
    logistics: t("admin-roles.roleDescriptions.logistics"),
    user: t("admin-roles.roleDescriptions.user"),
  };

  const breadcrumbItems = [
    {
      label: t("admin.dashboard.title"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("admin-roles.title"),
      href: "/admin/roles",
      icon: Users,
    },
  ];

  // Auto-switch to grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewMode("grid");
      } else {
        setViewMode("table"); // Reset to table view on desktop
      }
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Redirect if not admin
    if (status === "authenticated" && !session?.user?.admin) {
      toast.error("Unauthorized: Admin access required");
      router.push("/");
      return;
    }

    // Only fetch users if user is authenticated and admin
    if (status === "authenticated" && session?.user?.admin) {
      const fetchUsers = async () => {
        try {
          const response = await axios.get("/api/admin/users");
          setUsers(response.data.users || []);
          const initialRoles: Record<string, string> = {};
          response.data.users?.forEach((user: User) => {
            initialRoles[user._id] = user.role;
          });
          setSelectedRoles(initialRoles);
        } catch (error) {
          console.error(error);
          toast.error("Failed to fetch users");
          setUsers([]);
        } finally {
          setLoading(false);
        }
      };

      fetchUsers();
    }
  }, [status, session, router]);

  // Show loading for initial load or when checking auth
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Return null if not authenticated or not admin (will redirect in useEffect)
  if (status === "authenticated" && !session?.user?.admin) {
    return null;
  }

  const handleRoleSelect = (userId: string, role: string) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: role,
    }));
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "accounting" | "logistics" | "user"
  ) => {
    try {
      if (userId === session?.user?._id) {
        toast.error("You cannot change your own role");
        return;
      }

      const response = await axios.patch(`/api/admin/users/${userId}`, {
        role: newRole,
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: response.data.role } : user
        )
      );

      toast.success("Role updated successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to update role");
      } else {
        console.error("Error updating role:", error);
        toast.error("Failed to update role");
      }
    }
  };

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      await axios.patch(`/api/admin/users/${userId}`, {
        admin: !currentAdmin,
      });

      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, admin: !currentAdmin } : user
        )
      );

      toast.success("Admin status updated successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Failed to update admin status"
        );
      } else {
        console.error("Error updating admin status:", error);
        toast.error("Failed to update admin status");
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/admin/users", newUser);
      setUsers([...users, response.data.user]);
      setShowCreateModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        admin: false,
      });
      toast.success("User created successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to create user");
      } else {
        console.error("Error creating user:", error);
        toast.error("Failed to create user");
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await confirm({
      title: t("common.delete"),
      description: "Are you sure you want to delete this user? This action cannot be undone.",
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter((user) => user._id !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to delete user");
      } else {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("admin-roles.title")}
            </h1>
            <Button onClick={() => setShowCreateModal(true)}>
              {t("admin-roles.actions.createUser")}
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {t("admin-roles.description")}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 mt-6">
          <div className="bg-card/50 p-4 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700 m-4">
            <h2 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
              {t("admin-roles.availableRoles")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(ROLES).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col space-y-1 bg-card p-3 rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                >
                  <div className="font-medium text-[#535C91] dark:text-[#6B74A9]">
                    {value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {ROLE_DESCRIPTIONS[key as keyof typeof ROLE_DESCRIPTIONS]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="block md:hidden">
            {users?.map((user) => (
              <div
                key={user._id}
                className="p-4 border-b border-gray-200 dark:border-gray-700"
              >
                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {t("admin-roles.table.currentRole")}
                    </div>
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-800 dark:text-gray-200">
                      {ROLES[user.role as keyof typeof ROLES]}
                    </span>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {
                        ROLE_DESCRIPTIONS[
                          user.role as keyof typeof ROLE_DESCRIPTIONS
                        ]
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {t("admin-roles.table.assignNewRole")}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Select
                        value={selectedRoles[user._id]}
                        onValueChange={(value) =>
                          handleRoleSelect(user._id, value)
                        }
                        disabled={user._id === session?.user?._id}
                      >
                        <SelectTrigger className="bg-card border-gray-200 dark:border-gray-700">
                          <SelectValue
                            placeholder={t("admin-roles.table.assignNewRole")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRoles[user._id] !== user.role && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRoleChange(
                              user._id,
                              selectedRoles[user._id] as
                                | "admin"
                                | "accounting"
                                | "logistics"
                                | "user"
                            )
                          }
                          className="w-full bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                        >
                          {t("admin-roles.actions.save")}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {t("admin-roles.table.roleStatus")}
                    </div>
                    <span
                      className={cn(
                        "inline-block px-2 py-1 rounded-md text-sm",
                        user.admin
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                      )}
                    >
                      {user.admin
                        ? t("admin-roles.roles.admin")
                        : t("admin-roles.roles.user")}
                    </span>
                  </div>

                  <Button
                    variant={user.admin ? "destructive" : "default"}
                    onClick={() => toggleAdmin(user._id, user.admin)}
                    disabled={user._id === session?.user?._id}
                    className="w-[120px]"
                  >
                    {user.admin
                      ? t("admin-roles.actions.removeAdmin")
                      : t("admin-roles.actions.makeAdmin")}
                  </Button>

                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={user._id === session?.user?._id}
                    >
                      {t("admin-roles.actions.delete")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    {t("admin-roles.table.name")}
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    {t("admin-roles.table.email")}
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    {t("admin-roles.table.assignNewRole")}
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">
                    {t("admin-roles.table.roleStatus")}
                  </TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-300">
                    {t("admin-roles.table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user._id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <Select
                          value={selectedRoles[user._id]}
                          onValueChange={(value) =>
                            handleRoleSelect(user._id, value)
                          }
                          disabled={user._id === session?.user?._id}
                        >
                          <SelectTrigger className="w-[180px] bg-card border-gray-200 dark:border-gray-700">
                            <SelectValue
                              placeholder={t("admin-roles.table.assignNewRole")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedRoles[user._id] !== user.role && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleRoleChange(
                                user._id,
                                selectedRoles[user._id] as
                                  | "admin"
                                  | "accounting"
                                  | "logistics"
                                  | "user"
                              )
                            }
                            className="whitespace-nowrap bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                          >
                            {t("admin-roles.actions.save")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded-md text-sm whitespace-nowrap",
                            user.admin
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                          )}
                        >
                          {user.admin
                            ? t("admin-roles.roles.admin")
                            : t("admin-roles.roles.user")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={user.admin ? "destructive" : "default"}
                        onClick={() => toggleAdmin(user._id, user.admin)}
                        disabled={user._id === session?.user?._id}
                        className="whitespace-nowrap w-[120px]"
                      >
                        {user.admin
                          ? t("admin-roles.actions.removeAdmin")
                          : t("admin-roles.actions.makeAdmin")}
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={user._id === session?.user?._id}
                      >
                        {t("admin-roles.actions.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin-roles.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("admin-roles.table.name")}</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="email">{t("admin-roles.table.email")}</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="role">{t("admin-roles.table.currentRole")}</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("admin-roles.table.currentRole")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="admin"
                checked={newUser.admin}
                onChange={(e) =>
                  setNewUser({ ...newUser, admin: e.target.checked })
                }
              />
              <Label htmlFor="admin">
                {t("admin-roles.actions.makeAdmin")}
              </Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                {t("admin-roles.actions.cancel")}
              </Button>
              <Button type="submit">{t("admin-roles.actions.save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPage;

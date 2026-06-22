"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, Mail } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Subscriber {
  _id: string;
  email: string;
  source: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  lastEmailSentAt?: string;
  preferences: {
    marketing: boolean;
    updates: boolean;
    promotions: boolean;
  };
}

export default function NewsletterManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.newsletter"),
      href: "/admin/newsletter",
      icon: Mail,
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("/api/newsletter/subscribers");
        setSubscribers(res.data);
      } catch (error) {
        console.error("Failed to fetch subscribers:", error);
        toast.error(t("common.error"));
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.admin) {
      fetchSubscribers();
    }
  }, [session, t]);

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

  const toggleSubscriberStatus = async (
    subscriberId: string,
    currentStatus: boolean
  ) => {
    try {
      setActionLoading(subscriberId);
      await axios.patch(`/api/newsletter/subscribers/${subscriberId}`, {
        isActive: !currentStatus,
      });
      setSubscribers((prev) =>
        prev.map((sub) =>
          sub._id === subscriberId ? { ...sub, isActive: !currentStatus } : sub
        )
      );
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Failed to update subscriber status:", error);
      toast.error(t("common.error"));
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSubscriber = async (subscriberId: string) => {
    const confirmed = await confirm({
      title: t("common.delete"),
      description: t("common.deleteSubscriberConfirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    try {
      setActionLoading(subscriberId);
      await axios.delete(`/api/newsletter/subscribers/${subscriberId}`);
      setSubscribers((prev) => prev.filter((sub) => sub._id !== subscriberId));
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Failed to delete subscriber:", error);
      toast.error(t("common.error"));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (
    status === "loading" ||
    (status === "authenticated" && !session?.user?.admin)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("newsletter.admin.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
                {t("admin-newsletter.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t("admin-newsletter.description")}
              </p>
            </div>
            <div className="flex gap-3">
              <Input
                type="search"
                placeholder={t("admin-newsletter.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]" />
                <span className="animate-pulse">
                  {t("admin-newsletter.loading")}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Grid View */}
              <div className="block md:hidden">
                <div className="grid grid-cols-1 gap-4 p-4">
                  {filteredSubscribers.map((subscriber) => (
                    <div
                      key={subscriber._id}
                      className="bg-card/50 rounded-lg shadow p-4 flex flex-col gap-2"
                    >
                      <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 break-all">
                        {subscriber.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Source: {subscriber.source}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>{t("admin-newsletter.table.status")}:</span>
                        <Switch
                          checked={subscriber.isActive}
                          onCheckedChange={() =>
                            toggleSubscriberStatus(
                              subscriber._id,
                              subscriber.isActive
                            )
                          }
                          disabled={actionLoading === subscriber._id}
                        />
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("admin-newsletter.table.subscribedAt")}:{" "}
                        {new Date(subscriber.subscribedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t("admin-newsletter.table.lastEmail")}:{" "}
                        {subscriber.lastEmailSentAt
                          ? new Date(
                              subscriber.lastEmailSentAt
                            ).toLocaleDateString()
                          : "Never"}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSubscriber(subscriber._id)}
                          disabled={actionLoading === subscriber._id}
                        >
                          {actionLoading === subscriber._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                          ) : (
                            t("admin-newsletter.actions.delete")
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin-newsletter.table.email")}</TableHead>
                      <TableHead>
                        {t("admin-newsletter.table.source")}
                      </TableHead>
                      <TableHead>
                        {t("admin-newsletter.table.status")}
                      </TableHead>
                      <TableHead>
                        {t("admin-newsletter.table.subscribedAt")}
                      </TableHead>
                      <TableHead>
                        {t("admin-newsletter.table.lastEmail")}
                      </TableHead>
                      <TableHead>
                        {t("admin-newsletter.table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber._id}>
                        <TableCell>{subscriber.email}</TableCell>
                        <TableCell>{subscriber.source}</TableCell>
                        <TableCell>
                          <Switch
                            checked={subscriber.isActive}
                            onCheckedChange={() =>
                              toggleSubscriberStatus(
                                subscriber._id,
                                subscriber.isActive
                              )
                            }
                            disabled={actionLoading === subscriber._id}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(
                            subscriber.subscribedAt
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {subscriber.lastEmailSentAt
                            ? new Date(
                                subscriber.lastEmailSentAt
                              ).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSubscriber(subscriber._id)}
                            disabled={actionLoading === subscriber._id}
                          >
                            {actionLoading === subscriber._id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                            ) : (
                              t("admin-newsletter.actions.delete")
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

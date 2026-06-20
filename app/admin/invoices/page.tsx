"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Search as SearchIcon,
  Download,
  Printer,
  FileText,
  Eye,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { translationLoader } from "@/utils/translationLoader";

interface OrderProduct {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
    displayNames?: { [key: string]: string };
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  invoiceNumber: string;
  total: number;
  cartProducts: OrderProduct[];
  createdAt: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceType: "one-time" | "period";
  periodInvoiceNumber?: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  orders: Order[];
  items: any[];
  user: {
    name: string;
    email: string;
  };
  paymentProofUrl?: string;
  paymentReference?: string;
  paymentDate?: string;
}

const InvoiceListItem = ({
  invoice,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onPrint,
  onDownload,
  getStatusColor,
}: {
  invoice: Invoice;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onPrint: (id: string, asReceipt: boolean) => void;
  onDownload: (id: string, asReceipt: boolean) => void;
  getStatusColor: (status: string) => string;
}) => {
  const { t, language } = useTranslation();
  const router = useRouter();
  const isPaid = invoice.status === "paid";

  const handleViewDetails = () => {
    router.push(`/admin/invoices/${invoice.invoiceNumber}`);
  };

  return (
    <div className="bg-card rounded-lg shadow-sm mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onToggleExpand(invoice._id)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {invoice.invoiceNumber}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin-invoice.customer")}: {invoice.user.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right mr-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t("admin-invoice.amount")}: ${invoice.amount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin-invoice.date")}:{" "}
                {format(new Date(invoice.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {t(`admin-invoice.status.${invoice.status}`)}
            </Badge>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrint(invoice.invoiceNumber, isPaid)}
                title={
                  isPaid
                    ? language === "zh-TW"
                      ? "列印收據"
                      : "Print receipt"
                    : t("admin-invoice.actions.print")
                }
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(invoice.invoiceNumber, isPaid)}
                title={
                  isPaid
                    ? language === "zh-TW"
                      ? "下載收據"
                      : "Download receipt"
                    : t("admin-invoice.actions.download")
                }
              >
                <Download className="h-4 w-4" />
              </Button>
              {isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(invoice.invoiceNumber, false)}
                  title={language === "zh-TW" ? "下載原始發票" : "Download invoice"}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                title={t("admin-invoice.actions.viewDetails")}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 bg-card/50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold mb-2">
                {t("admin-invoice.table.headers.amount")}
              </div>
              <div>${invoice.amount.toFixed(2)}</div>
            </div>
            <div>
              <div className="font-semibold mb-2">
                {t("admin-invoice.table.headers.type")}
              </div>
              <div>
                {t(
                  `admin-invoice.filters.type.${
                    invoice.invoiceType === "period" ? "period" : "oneTime"
                  }`
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2">
                {t("admin-invoice.table.headers.date")}
              </div>
              <div>{format(new Date(invoice.createdAt), "MMM dd, yyyy")}</div>
            </div>
            <div>
              <div className="font-semibold mb-2">
                {t("admin-invoice.table.headers.orders")}
              </div>
              <div>{invoice.orders?.length || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminInvoicesPage() {
  const { t, language } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedInvoices, setExpandedInvoices] = useState(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  // PDF font scale for print/download (1 = current default). Remembered locally.
  const [fontScale, setFontScale] = useState("1");

  useEffect(() => {
    const saved = window.localStorage.getItem("invoicePdfScale");
    if (saved) setFontScale(saved);
  }, []);

  const handleFontScaleChange = (value: string) => {
    setFontScale(value);
    window.localStorage.setItem("invoicePdfScale", value);
  };

  const fontSizeOptions = [
    { value: "0.75", label: language === "zh-TW" ? "極小" : "Extra small" },
    { value: "0.85", label: language === "zh-TW" ? "小" : "Small" },
    { value: "1", label: language === "zh-TW" ? "標準" : "Normal" },
    { value: "1.15", label: language === "zh-TW" ? "大" : "Large" },
  ];

  // Force reload translations when component mounts
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        await Promise.all([
          translationLoader.loadTranslationModule(language, "admin-invoice"),
          translationLoader.loadTranslationModule(language, "common"),
          translationLoader.loadTranslationModule(language, "navigation"),
        ]);
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };
    loadTranslations();
  }, [language]);

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/invoices");
      return;
    }

    if (session?.user && !session.user.admin) {
      router.push("/");
      return;
    }
  }, [status, session, router]);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      console.log("Fetching invoices with params:", {
        type: filterType,
        status: filterStatus,
        search: searchTerm,
        params: params.toString(),
      });

      const response = await axios.get(`/api/invoices/admin?${params}`);
      if (response.data.success) {
        console.log("Received invoices:", {
          count: response.data.invoices?.length || 0,
          sample: response.data.invoices?.slice(0, 1),
        });
        setInvoices(response.data.invoices || []);
        setError(null);
      } else {
        console.error("Failed to fetch invoices:", response.data);
        setError(t("admin-invoice.messages.error.fetch"));
        setInvoices([]);
      }
    } catch (error: any) {
      console.error("Error fetching invoices:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        details: error.response?.data?.details,
      });
      if (error.response?.data?.error) {
        setError(
          t(`admin-invoice.messages.error.${error.response.data.error}`) ||
            error.response.data.error
        );
      } else {
        setError(t("admin-invoice.messages.error.fetch"));
      }
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterStatus, searchTerm, t]);

  // Fetch invoices when filters or search change
  useEffect(() => {
    if (session?.user?.admin) {
      fetchInvoices();
    }
  }, [session, filterType, filterStatus, searchTerm, fetchInvoices]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "overdue":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const toggleExpand = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
    } else {
      newExpanded.add(invoiceId);
    }
    setExpandedInvoices(newExpanded);
  };

  const handlePrint = async (invoiceNumber: string, asReceipt = false) => {
    try {
      const docParam = asReceipt ? "&doc=receipt" : "";
      const response = await fetch(
        `/api/invoices/${invoiceNumber}/print?lang=${language}&scale=${fontScale}${docParam}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to print invoice");
      }

      // Create a blob from the PDF stream
      const blob = await response.blob();
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Open the PDF in a new window
      window.open(url, "_blank");
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error(t("admin-invoice.messages.error.print"));
    }
  };

  const handleDownload = async (invoiceNumber: string, asReceipt = false) => {
    try {
      const docParam = asReceipt ? "&doc=receipt" : "";
      const response = await fetch(
        `/api/invoices/${invoiceNumber}/download?lang=${language}&scale=${fontScale}${docParam}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to download invoice");
      }

      // Create a blob from the PDF stream
      const blob = await response.blob();
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `${asReceipt ? "receipt" : "invoice"}-${invoiceNumber}.pdf`;

      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error(t("admin-invoice.messages.error.download"));
    }
  };

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true);
      const response = await fetch("/api/invoices/cleanup", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clean up invoices");
      }

      // Refresh the invoices list
      await fetchInvoices();
    } catch (error) {
      console.error("Error cleaning up invoices:", error);
      setError("Failed to clean up invoices");
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleStatusChange = async (
    invoiceNumber: string,
    newStatus: string
  ) => {
    try {
      const response = await axios.patch(
        `/api/invoices/admin/${invoiceNumber}`,
        {
          status: newStatus,
        }
      );

      if (response.data.success) {
        const updatedInvoices = invoices.map((inv) =>
          inv.invoiceNumber === invoiceNumber ? response.data.invoice : inv
        );
        setInvoices(updatedInvoices);
        toast.success(t("admin-invoice.messages.success.statusUpdate"));
      }
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error(t("admin-invoice.messages.error.update"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t("admin-invoice.page.title")}
            </h1>
            <p className="text-gray-600">
              {t("admin-invoice.page.description")}
            </p>
          </div>
          <Button
            onClick={handleCleanup}
            disabled={isCleaningUp}
            variant="outline"
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("admin-invoice.messages.loading")}
              </>
            ) : (
              t("admin-invoice.actions.cleanup")
            )}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("admin-invoice.filters.type.label")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("admin-invoice.filters.type.all")}
            </SelectItem>
            <SelectItem value="one-time">
              {t("admin-invoice.filters.type.oneTime")}
            </SelectItem>
            <SelectItem value="period">
              {t("admin-invoice.filters.type.period")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={t("admin-invoice.filters.status.label")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("admin-invoice.filters.status.all")}
            </SelectItem>
            <SelectItem value="pending">
              {t("admin-invoice.filters.status.pending")}
            </SelectItem>
            <SelectItem value="paid">
              {t("admin-invoice.filters.status.paid")}
            </SelectItem>
            <SelectItem value="overdue">
              {t("admin-invoice.filters.status.overdue")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={fontScale} onValueChange={handleFontScaleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={language === "zh-TW" ? "字體大小" : "Font size"}
            />
          </SelectTrigger>
          <SelectContent>
            {fontSizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {(language === "zh-TW" ? "字體：" : "Font: ") + option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={t("admin-invoice.filters.search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          {t("admin-invoice.messages.error.fetch")}
        </div>
      )}

      {isLoading ? (
        <InvoiceListSkeleton />
      ) : invoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t("admin-invoice.messages.noInvoices")}
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <InvoiceListItem
              key={invoice._id}
              invoice={invoice}
              isExpanded={expandedInvoices.has(invoice._id)}
              onToggleExpand={toggleExpand}
              onStatusChange={handleStatusChange}
              onPrint={handlePrint}
              onDownload={handleDownload}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg" />
        </Card>
      ))}
    </div>
  );
}

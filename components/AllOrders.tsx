"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  CheckCircle,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";
import Image from "next/image";
import VehicleAssignment from "@/components/logistics/VehicleAssignment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useCartStore from "@/store/cartStore";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/utils/formatAddress";

interface SessionUser {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface AddressComponents {
  roomFlat?: string;
  floor?: string;
  blockNumber?: string;
  blockName?: MultiLangValue;
  buildingName?: MultiLangValue;
  streetNumber?: string;
  streetName?: MultiLangValue;
  district?: MultiLangValue;
  location?: MultiLangValue;
  formattedAddress?: MultiLangValue;
}

interface OrderItem {
  id: {
    _id: string;
    name: string;
    displayNames: {
      en: string;
      "zh-TW": string;
    };
    images?: string[];
    price: number;
  };
  quantity: number;
}

interface Order {
  _id: string;
  name: string;
  email: string;
  items: OrderItem[];
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentProof?: string;
  paymentReference?: string;
  vehicleAssigned?: boolean;
  deliveryCost?: number;
  orderType: "onetime-order" | "period-order";
  periodInvoiceNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  orderNumber?: string; // Added for new order number display
  orderReference?: string; // Added for new order number display
}

interface Props {
  filterStatus?: string;
}

interface DeliveryMethod {
  cost: number;
  name: {
    en: string;
    "zh-TW": string;
  };
}

interface DeliverySettings {
  deliveryMethods: DeliveryMethod[];
  freeDeliveryThreshold: number;
  bankAccountDetails: string;
}

const OrdersSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="bg-card/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <LoadingSkeleton height="h-6" width="w-48" />
            <div className="flex items-center gap-4">
              <LoadingSkeleton height="h-6" width="w-24" />
              <div className="flex gap-2">
                <LoadingSkeleton height="h-8" width="w-24" />
                <LoadingSkeleton height="h-8" width="w-24" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <LoadingSkeleton height="h-4" width="w-32" />
              <LoadingSkeleton height="h-4" width="w-24" />
            </div>
            <div className="flex justify-between">
              <LoadingSkeleton height="h-4" width="w-40" />
              <LoadingSkeleton height="h-4" width="w-20" />
            </div>
            <div className="flex justify-between">
              <LoadingSkeleton height="h-4" width="w-36" />
              <LoadingSkeleton height="h-4" width="w-28" />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <LoadingSkeleton height="h-4" width="w-32" />
            <div className="flex gap-2">
              <LoadingSkeleton height="h-8" width="w-8" />
              <LoadingSkeleton height="h-8" width="w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Orders = ({ filterStatus }: Props) => {
  const { data: session, status } = useSession() as {
    data: SessionUser | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const confirm = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [periodInvoices, setPeriodInvoices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(filterStatus || "all");
  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettings | null>(null);

  // Get active tab from URL or default to "onetime"
  const activeTab = searchParams?.get("tab") || "onetime";

  // Function to update URL with new tab
  const handleTabChange = (value: string) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("tab", value);
    router.push(newUrl.pathname + newUrl.search);
  };

  const limit = 5;
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const clearCart = useCartStore((state) => state.clearCart);

  // Fetch delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await axios.get("/api/delivery");
        setDeliverySettings(response.data);
      } catch (error) {
        console.error("Failed to fetch delivery settings:", error);
        toast.error(t("errors.fetchDeliverySettings"));
      }
    };
    fetchDeliverySettings();
  }, [t]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/orderAdmin?page=${page}&limit=${limit}${
            selectedStatus !== "all" ? `&status=${selectedStatus}` : ""
          }&language=${language}&viewMode=${activeTab}`
        );

        if (activeTab === "period") {
          // Group period orders by periodInvoiceNumber
          const periodOrders = res.data.orders.filter(
            (order) => order.orderType === "period-order"
          );
          const groupedOrders = periodOrders.reduce((acc, order) => {
            if (!acc[order.periodInvoiceNumber]) {
              acc[order.periodInvoiceNumber] = [];
            }
            acc[order.periodInvoiceNumber].push(order);
            return acc;
          }, {});
          setOrders(periodOrders);
          setPeriodInvoices(
            Object.entries(groupedOrders).map(([invoiceNumber, orders]) => ({
              invoiceNumber,
              orders,
              // Take period dates from first order
              periodStart: orders[0]?.createdAt,
              periodEnd: orders[0]?.createdAt, // This should be updated to actual period end
            }))
          );
        } else {
          setOrders(
            res.data.orders.filter(
              (order) => order.orderType === "onetime-order"
            )
          );
          setPeriodInvoices([]);
        }

        setHasMore(res.data.hasMore);
        setTotalOrders(res.data.totalOrders);
      } catch (error) {
        console.log(error);
        toast.error(t("admin-orders.errors.fetchFailed"));
      }
      setLoading(false);
    };
    fetchOrders();
  }, [page, selectedStatus, language, activeTab, t]);

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      const res = await axios.put("/api/orderAdmin", { orderId });
      if (res.data.order) {
        setOrders(
          orders.map((order) =>
            order._id === orderId ? { ...order, status: "delivered" } : order
          )
        );
        toast.success(t("admin-orders.actions.markAsDeliveredSuccess"));
      }
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      toast.error(t("admin-orders.actions.markAsDeliveredError"));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = await confirm({
      title: t("common.delete"),
      description: t("admin-orders.actions.delete.confirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (confirmed) {
      try {
        const response = await axios.delete(
          `/api/orderAdmin?orderId=${orderId}`
        );
        if (response.data.success) {
          setOrders(orders.filter((order) => order._id !== orderId));
          toast.success(t("admin-orders.actions.delete.success"));
        } else {
          console.error("Failed to delete order:", response.data);
          toast.error(t("admin-orders.actions.delete.error"));
        }
      } catch (error: any) {
        // Structured error logging
        console.error("Error deleting order:", {
          message: error.message,
          response: error.response
            ? {
                data: error.response.data,
                status: error.response.status,
                statusText: error.response.statusText,
              }
            : "No response",
          config: error.config
            ? {
                url: error.config.url,
                method: error.config.method,
                params: error.config.params,
              }
            : "No config",
          stack: error.stack,
        });

        // Show appropriate error message
        if (error.response?.data?.error) {
          const errorKey = `admin-orders.errors.${error.response.data.error}`;
          const translatedError = t(errorKey);
          toast.error(
            translatedError !== errorKey
              ? translatedError
              : error.response.data.error
          );
        } else if (error.message) {
          toast.error(
            `${t("admin-orders.actions.delete.error")}: ${error.message}`
          );
        } else {
          toast.error(t("admin-orders.actions.delete.error"));
        }
      }
    }
  };

  const totalPages = Math.ceil(totalOrders / limit);

  useEffect(() => {
    if (status !== "authenticated" && !session?.user) {
      router.push("/");
    }
  }, [status, session, router]);

  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await axios.put("/api/orderAdmin", {
        orderId: selectedOrderId,
        rejectPayment: true,
        rejectionReason: rejectionReason,
      });

      toast.success(t("admin-orders.payment.rejectSuccess"));
      setOrders(
        orders.map((o) =>
          o._id === selectedOrderId ? { ...o, status: "cancelled" } : o
        )
      );
      setIsRejectModalOpen(false);
      setRejectionReason("");
      setSelectedOrderId("");
    } catch (err) {
      toast.error(t("admin-orders.payment.rejectError"));
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const res = await axios.put("/api/orderAdmin", {
        orderId: orderId,
        confirmPayment: true,
      });
      if (res.data.success) {
        // Update the order status and refresh the order data
        const updatedOrder = res.data.order;
        setOrders(
          orders.map((o) =>
            o._id === orderId ? { ...updatedOrder, status: "processing" } : o
          )
        );
        toast.success(t("admin-orders.payment.confirmSuccess"));
        // Clear cart after confirming payment
        clearCart();
      }
    } catch (err) {
      toast.error(t("admin-orders.payment.confirmError"));
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await axios.put("/api/orderAdmin", {
        orderId,
        confirmPayment: true,
      });
      if (res.data.success) {
        // Update the order status and refresh the order data
        const updatedOrder = res.data.order;
        setOrders(
          orders.map((order) =>
            order._id === orderId
              ? { ...updatedOrder, status: "processing" }
              : order
          )
        );
        // Clear cart after approving period order
        clearCart();
        toast.success(t("admin-periodorders.actions.approveSuccess"));
      }
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error(t("admin-periodorders.actions.approveError"));
    }
  };

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      const res = await axios.put("/api/orderAdmin", {
        orderId,
        rejectPayment: true,
        rejectionReason: reason,
      });
      if (res.data.success) {
        setOrders(
          orders.map((order) =>
            order._id === orderId ? { ...order, status: "cancelled" } : order
          )
        );
        toast.success(t("admin-periodorders.actions.rejectSuccess"));
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast.error(t("admin-periodorders.actions.rejectError"));
    }
  };

  const renderOrderActions = (order: Order) => {
    if (order.status === "pending") {
      return (
        <div className="flex gap-2">
          <Button
            onClick={() => handleApproveOrder(order._id)}
            className="bg-green-600 hover:bg-green-700"
          >
            {t("admin-periodorders.actions.approve")}
          </Button>
          <Button
            onClick={() => {
              setSelectedOrderId(order._id);
              setIsRejectModalOpen(true);
            }}
            variant="destructive"
          >
            {t("admin-periodorders.actions.reject")}
          </Button>
        </div>
      );
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Function to safely format total
  const formatTotal = (total: number | undefined | null): string => {
    if (typeof total === "number") {
      return total.toFixed(2);
    }
    return "0.00";
  };

  const renderOrderItems = (order: Order) => {
    if (!order.items?.length) return null;

    return order.items.map((item, index) => {
      const price = item.id?.price || 0;
      const quantity = item.quantity || 0;
      const itemTotal = price * quantity;
      const imageUrl = item.id?.images?.[0] || "/placeholder.png";

      return (
        <div
          key={item.id?._id || index}
          className="flex items-center space-x-4 py-2 border-b last:border-0 dark:border-gray-700"
        >
          <div className="relative w-16 h-16">
            <Image
              src={imageUrl}
              alt={
                item.id?.displayNames?.[language] || item.id?.name || "Product"
              }
              fill
              className="object-cover rounded-lg"
              sizes="64px"
            />
          </div>
          <div className="flex-grow">
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {item.id?.displayNames?.[language] ||
                item.id?.name ||
                t("order.common.productNotAvailable")}
            </p>
            <p className="text-sm text-gray-500">
              {t("order.details.items.quantity")}: {quantity}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-800 dark:text-gray-200">
              ${formatTotal(price)}
            </p>
            <p className="text-sm text-gray-500">${formatTotal(itemTotal)}</p>
          </div>
        </div>
      );
    });
  };

  const renderOrderCard = (order: Order) => {
    if (!order) return null;

    // Calculate subtotal from items
    const subtotal =
      order.items?.reduce((sum, item) => {
        return sum + (item.id?.price || 0) * (item.quantity || 0);
      }, 0) || 0;

    // Get delivery cost
    const deliveryCost = order.deliveryCost || 0;

    // Calculate total
    const total = subtotal + deliveryCost;

    // Get delivery method name
    const getDeliveryMethodName = () => {
      if (!deliverySettings?.deliveryMethods)
        return t("admin-orders.details.items.deliveryNotFound");
      const method =
        deliverySettings.deliveryMethods[order.deliveryMethod || 0];
      return method
        ? method.name[language]
        : t("admin-orders.details.items.deliveryNotFound");
    };

    // Status flags
    const showPaymentVerificationButtons =
      order.status === "pending_payment_verification";
    const showVehicleAssignment = order.status === "processing";
    const paymentProofUrl = order.paymentProof || null;

    // Add period invoice info if it's a period order
    const periodInfo = order.orderType === "period-order" && (
      <div className="mb-6 bg-primary/10 p-4 rounded-lg">
        <h2 className="text-2xl font-bold text-primary">
          {t("admin-periodorders.periodInvoice.title", {
            number: order.periodInvoiceNumber,
          })}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {format(new Date(order.createdAt), "MMMM yyyy")}
        </p>
      </div>
    );

    return (
      <div className="bg-card rounded-lg shadow p-6">
        {periodInfo}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {order.orderReference || "N/A"}
            </h3>
            <p className="text-sm text-gray-500">
              {order.createdAt
                ? format(new Date(order.createdAt), "PPP")
                : "N/A"}
            </p>
          </div>
          <Badge
            className={`${getStatusColor(
              order.status
            )} text-sm font-medium px-3 py-1`}
          >
            {t(`admin-orders.status.${order.status || "unknown"}`)}
          </Badge>
        </div>

        {/* Customer Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{t("admin-orders.details.customerInfo.name")}:</strong>{" "}
            {order.name || "N/A"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{t("admin-orders.details.customerInfo.email")}:</strong>{" "}
            {order.email || "N/A"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{t("admin-orders.details.customerInfo.phone")}:</strong>{" "}
            {order.phone || t("common.noPhone")}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{t("admin-orders.details.address.shipping")}:</strong>{" "}
            {language === "zh-TW"
              ? order.shippingAddress?.["zh-TW"]
              : order.shippingAddress?.en || "N/A"}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-card/50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            {t("admin-orders.details.items.title")}
          </h4>
          {renderOrderItems(order)}

          {/* Delivery Method */}
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {t("admin-orders.details.items.deliveryMethod")}
              </span>
              <span className="text-gray-800 dark:text-gray-200">
                {getDeliveryMethodName()}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {t("admin-orders.details.items.subtotal")}
              </span>
              <span className="text-gray-800 dark:text-gray-200">
                ${formatTotal(subtotal)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {t("admin-orders.details.items.deliveryCost")}
              </span>
              <span className="text-gray-800 dark:text-gray-200">
                ${formatTotal(deliveryCost)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t dark:border-gray-600">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {t("admin-orders.details.items.total")}
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                ${formatTotal(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Assignment Section */}
        {showVehicleAssignment && (
          <div className="mb-4 bg-card/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
              {t("admin-orders.delivery.assignVehicle")}
            </h4>
            <VehicleAssignment
              orderId={order._id}
              currentStatus={order.status}
              onAssignmentComplete={() => {
                // Refresh orders after assignment
                setPage(1);
              }}
            />
          </div>
        )}

        {/* Payment Proof Section */}
        {paymentProofUrl && (
          <div className="mb-4 bg-card/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              {t("admin-orders.payment.proof")}
            </h4>
            <div className="relative w-full h-48 mb-4">
              <Image
                src={paymentProofUrl}
                alt={t("admin-orders.payment.proof")}
                fill
                className="object-contain rounded-lg cursor-pointer"
                onClick={() => setLightboxUrl(paymentProofUrl)}
              />
            </div>
            {order.paymentReference && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <strong>{t("admin-orders.payment.reference")}:</strong>{" "}
                {order.paymentReference}
              </p>
            )}
            {/* Show payment verification buttons when status is pending_payment_verification */}
            {showPaymentVerificationButtons && (
              <div className="flex gap-2 justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleConfirmPayment(order._id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {t("admin-orders.actions.approve")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedOrderId(order._id);
                    setIsRejectModalOpen(true);
                  }}
                >
                  {t("admin-orders.actions.reject")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          {order.status === "processing" && !order.vehicleAssigned && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMarkAsDelivered(order._id)}
              disabled={true}
              title={t("admin-orders.delivery.assignVehicleFirst")}
            >
              {t("admin-orders.actions.markAsDelivered")}
            </Button>
          )}
          {order.status === "processing" && order.vehicleAssigned && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMarkAsDelivered(order._id)}
            >
              {t("admin-orders.actions.markAsDelivered")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/orders/${order._id}`)}
          >
            {t("admin-orders.actions.view")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteOrder(order._id)}
          >
            {t("admin-orders.actions.delete.confirm")}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="onetime">
              {t("admin-orders.tabs.oneTime")}
            </TabsTrigger>
            <TabsTrigger value="period">
              {t("admin-orders.tabs.period")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="onetime">
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id}>{renderOrderCard(order)}</div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="period">
            <div className="space-y-4">
              {periodInvoices.map((invoice) => (
                <div
                  key={invoice.invoiceNumber}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">
                      {t("admin-orders.periodInvoice.title", {
                        number: invoice.invoiceNumber,
                      })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(invoice.periodStart), "PPP")} -{" "}
                      {format(new Date(invoice.periodEnd), "PPP")}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {invoice.orders.map((order: Order) => (
                      <div
                        key={order._id}
                        className="border-t pt-4 first:border-t-0 first:pt-0"
                      >
                        {renderOrderCard(order)}
                        {renderOrderActions(order)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={handlePrevPage}
          disabled={page === 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("common.previous")}
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t("common.page")} {page} {t("common.of")} {totalPages}
        </span>
        <Button
          onClick={handleNextPage}
          disabled={!hasMore}
          variant="outline"
          size="sm"
        >
          {t("common.next")}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("order.details.payment.proof")}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[60vh]">
              <Image
                src={lightboxUrl}
                alt={t("order.details.payment.proof")}
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Payment Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin-orders.actions.rejectPayment")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t("admin-orders.actions.rejectReason")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => handleRejectPayment()}
              disabled={!rejectionReason}
            >
              {t("admin-orders.actions.confirm")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectionReason("");
              }}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

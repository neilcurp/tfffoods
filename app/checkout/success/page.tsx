"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, CreditCard, FileText } from "lucide-react";
import axios from "axios";
import useCartStore from "@/store/cartStore";
import { useTranslation } from "@/providers/language/LanguageContext";
import Image from "next/image";

function shouldClearCartForOrder(order: {
  paymentMethod?: string;
  status?: string;
  paid?: boolean;
}) {
  if (order.paymentMethod === "online") {
    return order.status === "processing" || order.paid === true;
  }
  if (
    order.paymentMethod === "offline" ||
    order.paymentMethod === "periodInvoice"
  ) {
    return order.status === "processing";
  }
  return false;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);

  // Initial order fetch
  useEffect(() => {
    const orderId = searchParams?.get ? searchParams.get("orderId") : null;
    if (!orderId) {
      setError(t("checkout.success.error.noOrderId"));
      setIsLoading(false);
      return;
    }

    // Function to fetch order status
    const fetchOrder = async (orderId: string) => {
      try {
        const response = await axios.get(`/api/orders/${orderId}`);
        setOrder(response.data);
        console.log("Order data received:", response.data);

        if (shouldClearCartForOrder(response.data)) {
          console.log("Clearing cart for confirmed payment");
          await clearCart();
        }

        // Only set redirect timer for online payments once confirmed
        if (
          response.data.paymentMethod === "online" &&
          shouldClearCartForOrder(response.data)
        ) {
          setTimeout(() => {
            router.push("/profile");
          }, 5000);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(t("checkout.success.error.verificationFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder(orderId);
  }, [router, searchParams, t, clearCart]);

  // Poll until payment is confirmed (Stripe webhook may lag behind success redirect)
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const pollOrderStatus = async () => {
      const orderId = searchParams?.get("orderId");
      if (!orderId) return;

      try {
        const response = await axios.get(`/api/orders/${orderId}`);
        const updatedOrder = response.data;
        setOrder(updatedOrder);

        if (shouldClearCartForOrder(updatedOrder)) {
          console.log("Order confirmed, clearing cart");
          await clearCart();
          if (pollInterval) clearInterval(pollInterval);

          if (updatedOrder.paymentMethod === "online") {
            setTimeout(() => {
              router.push("/profile");
            }, 5000);
          }
        }
      } catch (error) {
        console.error("Error polling order status:", error);
      }
    };

    const needsPolling =
      order &&
      !shouldClearCartForOrder(order) &&
      (order.paymentMethod === "online" ||
        ((order.paymentMethod === "offline" ||
          order.paymentMethod === "periodInvoice") &&
          order.status === "pending"));

    if (needsPolling) {
      pollInterval = setInterval(pollOrderStatus, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [order, searchParams, clearCart, router]);

  // Rest of the component remains the same...
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">
            {t("checkout.success.verifyingOrder")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={() => router.push("/profile")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {t("checkout.success.goToProfile")}
          </button>
        </div>
      </div>
    );
  }

  if (order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-2xl w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {t("confirmation.orderConfirmed")}
            </h1>

            {/* Payment Method Specific Messages */}
            {order.paymentMethod === "online" && (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CreditCard className="w-5 h-5" />
                <p>{t("confirmation.paymentReceived")}</p>
              </div>
            )}

            {order.paymentMethod === "offline" && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-yellow-700 mr-2" />
                  <p className="text-yellow-700">
                    {order.status === "processing"
                      ? t("confirmation.offlinePayment.confirmed")
                      : t("confirmation.offlinePayment.instructions")}
                  </p>
                </div>
                {order.paymentProof && (
                  <div className="mt-4">
                    <p className="text-sm text-yellow-700 mb-2">
                      {t("confirmation.offlinePayment.proofUploaded")}
                    </p>
                    <Image
                      src={order.paymentProof}
                      alt="Payment Proof"
                      width={200}
                      height={100}
                      className="mx-auto rounded-lg"
                    />
                  </div>
                )}
                {order.status === "pending" && (
                  <p className="mt-4 text-sm text-yellow-700">
                    {t("confirmation.offlinePayment.pendingVerification")}
                  </p>
                )}
              </div>
            )}

            {order.paymentMethod === "periodInvoice" && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-700 mr-2" />
                  <p className="text-blue-700">
                    {t("confirmation.periodPayment.message")}
                  </p>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                {t("confirmation.orderDetails.title")}
              </h2>
              <div className="space-y-2 text-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">
                    {t("confirmation.orderDetails.orderId")}:
                  </span>
                  <span>{order._id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">
                    {t("confirmation.orderDetails.name")}:
                  </span>
                  <span>{order.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">
                    {t("confirmation.orderDetails.email")}:
                  </span>
                  <span>{order.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">
                    {t("confirmation.orderDetails.status")}:
                  </span>
                  <span>{t(`order.status.${order.status}`)}</span>
                </div>
                {order.paymentReference && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">
                      {t("confirmation.orderDetails.paymentReference")}:
                    </span>
                    <span>{order.paymentReference}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <span className="font-medium">
                    {t("confirmation.orderDetails.total")}:
                  </span>
                  <span className="font-bold">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/profile?tab=orders")}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                {t("checkout.success.goToOrders")}
              </button>
              {order.paymentMethod === "offline" &&
                order.status === "pending" && (
                  <button
                    onClick={() => router.push("/cart")}
                    className="bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200"
                  >
                    {t("checkout.success.returnToCart")}
                  </button>
                )}
              <button
                onClick={() => router.push("/")}
                className="bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200"
              >
                {t("checkout.success.continueShopping")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SuccessPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

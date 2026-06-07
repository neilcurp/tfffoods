"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useTranslation } from "@/providers/language/LanguageContext";
import type { Invoice, CartProduct } from "../invoiceTypes";

interface OrderSummaryCardProps {
  invoice: Invoice;
}

export default function OrderSummaryCard({ invoice }: OrderSummaryCardProps) {
  const { t, language } = useTranslation();

  return (
    <Card className="border-2 dark:border-white/20 border-gray-300">
      <CardHeader>
        <CardTitle>{t("order-details.sections.orderSummary")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoice.orders.map((order) => (
            <div key={order._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xl font-mono text-yellow-600 dark:text-yellow-400 mt-1">
                    #{order._id.slice(-12).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                {order.cartProducts.map((item: CartProduct) => (
                  <div
                    key={`${item.product._id}-${item.quantity}`}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 relative">
                        <Image
                          src={item.product.images[0]}
                          alt={
                            item.product.displayNames?.[language] ||
                            item.product.name
                          }
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {item.product.displayNames?.[language] ||
                            item.product.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("order-details.orderSummary.quantity")}:{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              {/* Order Summary */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{t("order-details.orderSummary.subtotal")}:</span>
                  <span>${(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{t("order-details.orderSummary.delivery")}:</span>
                  <span>${(order.deliveryCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>{t("order-details.orderSummary.total")}:</span>
                  <span>${(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Only show grand totals for period invoices */}
          {invoice.invoiceType === "period" && (
            <div className="mt-6 pt-6 border-t-2 dark:border-white/20 border-gray-300">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{t("invoices.subtotal")}:</span>
                  <span>
                    $
                    {invoice.orders
                      .reduce((sum, order) => sum + (order.subtotal || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{t("invoices.totalDelivery")}:</span>
                  <span>
                    $
                    {invoice.orders
                      .reduce((sum, order) => sum + (order.deliveryCost || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>{t("checkout.total")}:</span>
                  <span>
                    $
                    {invoice.orders
                      .reduce((sum, order) => sum + (order.total || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

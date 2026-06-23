"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/providers/language/LanguageContext";
import type { Invoice } from "../invoiceTypes";

interface AddressesCardProps {
  invoice: Invoice;
  formatInvoiceAddress: (address: any) => string;
}

export default function AddressesCard({
  invoice,
  formatInvoiceAddress,
}: AddressesCardProps) {
  const { t, language } = useTranslation();
  const firstOrder = invoice.orders?.[0];
  const deliveryMethod =
    firstOrder?.deliveryMethodName?.[language] ||
    firstOrder?.deliveryMethodName?.en ||
    t("order-details.addresses.notSpecified");

  return (
    <Card className="border-2 dark:border-white/20 border-gray-300">
      <CardHeader>
        <CardTitle>{t("order-details.addresses.deliveryTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
          <span className="font-medium text-muted-foreground">
            {t("order-details.addresses.address")}:
          </span>
          <p className="text-sm text-foreground mt-1">
            {formatInvoiceAddress(
              invoice.shippingAddress || invoice.billingAddress
            )}
          </p>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">
            {t("order.common.method")}:
          </span>
          <p className="text-sm text-foreground mt-1">{deliveryMethod}</p>
        </div>
      </CardContent>
    </Card>
  );
}

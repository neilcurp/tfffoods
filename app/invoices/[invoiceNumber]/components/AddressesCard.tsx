"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  const { t } = useTranslation();

  return (
    <Card className="border-2 dark:border-white/20 border-gray-300">
      <CardHeader>
        <CardTitle>{t("order-details.sections.addresses")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
          <span className="font-medium text-muted-foreground">
            {t("order-details.addresses.billing")}:
          </span>
          <p className="text-sm text-foreground mt-1">
            {formatInvoiceAddress(invoice.billingAddress)}
          </p>
        </div>
        <Separator className="my-4 dark:bg-white/20 bg-gray-300 h-0.5" />
        <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
          <span className="font-medium text-muted-foreground">
            {t("order-details.addresses.shipping")}:
          </span>
          <p className="text-sm text-foreground mt-1">
            {formatInvoiceAddress(invoice.shippingAddress)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

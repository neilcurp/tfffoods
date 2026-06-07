"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from "@/providers/language/LanguageContext";
import type { Invoice } from "../invoiceTypes";

interface InvoiceInfoCardProps {
  invoice: Invoice;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export default function InvoiceInfoCard({ invoice }: InvoiceInfoCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-2 dark:border-white/20 border-gray-300">
      <CardHeader>
        <CardTitle>{t("order-details.sections.invoiceDetails")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 border-b-2 dark:border-white/20 border-gray-300 pb-3">
            <span className="font-medium text-muted-foreground">
              {t("order-details.customerInfo.title")}:
            </span>
            <div className="mt-2 space-y-1">
              <p className="text-foreground">
                <span className="text-muted-foreground">
                  {t("order-details.customerInfo.name")}:{" "}
                </span>
                {invoice.user.name}
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">
                  {t("order-details.customerInfo.email")}:{" "}
                </span>
                {invoice.user.email}
              </p>
              {invoice.user.phone && (
                <p className="text-foreground">
                  <span className="text-muted-foreground">
                    {t("order-details.customerInfo.phone")}:{" "}
                  </span>
                  {invoice.user.phone}
                </p>
              )}
            </div>
          </div>
          <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
            <span className="font-medium text-muted-foreground">
              {t("order-details.orderInfo.invoiceNumber")}:
            </span>
            <p className="text-foreground">{invoice.invoiceNumber}</p>
          </div>
          {invoice.orders &&
            invoice.orders[0] &&
            invoice.invoiceType !== "period" && (
              <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                <span className="font-medium text-muted-foreground">
                  {t("order-details.orderInfo.orderNumber")}:
                </span>
                <p className="text-foreground font-mono">
                  #{invoice.orders[0]._id.slice(-12).toUpperCase()}
                </p>
              </div>
            )}
          <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
            <span className="font-medium text-muted-foreground">
              {t("order-details.orderInfo.status")}:
            </span>
            <Badge className={`ml-2 ${getStatusColor(invoice.status)}`}>
              {t(`order-details.status.${invoice.status}`)}
            </Badge>
          </div>
          <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
            <span className="font-medium text-muted-foreground">
              {t("order-details.orderInfo.type")}:
            </span>
            <p className="text-foreground">
              {t(`order-details.orderInfo.${invoice.invoiceType}`)}
            </p>
          </div>
          <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
            <span className="font-medium text-muted-foreground">
              {t("order-details.orderInfo.created")}:
            </span>
            <p className="text-foreground">
              {format(new Date(invoice.createdAt), "PPP")}
            </p>
          </div>
          {invoice.invoiceType === "period" &&
            invoice.periodStart &&
            invoice.periodEnd && (
              <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                <span className="font-medium text-muted-foreground">
                  {t("invoices.periodDates")}:
                </span>
                <div className="mt-2 space-y-1">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">
                      {t("invoices.periodStart")}:{" "}
                    </span>
                    {format(new Date(invoice.periodStart), "PPP")}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">
                      {t("invoices.periodEnd")}:{" "}
                    </span>
                    {format(new Date(invoice.periodEnd), "PPP")}
                  </p>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

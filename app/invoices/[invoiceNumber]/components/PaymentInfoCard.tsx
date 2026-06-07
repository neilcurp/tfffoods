"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { format } from "date-fns";
import { CldUploadButton, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { useTranslation } from "@/providers/language/LanguageContext";
import type { Invoice } from "../invoiceTypes";

interface PaymentInfoCardProps {
  invoice: Invoice;
  paymentProofUrl: string;
  isSubmitting: boolean;
  cloudName: string;
  uploadPreset: string;
  handlePaymentProofUpload: (result: CloudinaryUploadWidgetResults) => void;
  handleSubmit: () => void;
}

export default function PaymentInfoCard({
  invoice,
  paymentProofUrl,
  isSubmitting,
  cloudName,
  uploadPreset,
  handlePaymentProofUpload,
  handleSubmit,
}: PaymentInfoCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-2 dark:border-white/20 border-gray-300">
      <CardHeader>
        <CardTitle>{t("order-details.sections.paymentInfo")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
          <span className="font-medium text-muted-foreground">
            {t("order-details.payment.method")}:
          </span>
          <p className="text-foreground capitalize">
            {invoice.paymentMethod
              ? t(`order-details.payment.${invoice.paymentMethod}`)
              : t("invoices.notSpecified")}
          </p>
        </div>
        {invoice.paymentReference && (
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {t("invoices.paymentReference")}:
            </span>
            <span>{invoice.paymentReference}</span>
          </div>
        )}
        {invoice.paymentDate && (
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {t("order-details.payment.date")}:
            </span>
            <span>{format(new Date(invoice.paymentDate), "PPP")}</span>
          </div>
        )}
        {invoice.paymentProofUrl ? (
          <div className="mt-4">
            <span className="font-medium block mb-2">
              {t("order-details.payment.proof")}:
            </span>
            <div className="relative w-full max-w-md mx-auto">
              <Image
                src={invoice.paymentProofUrl}
                alt="Payment Proof"
                width={800}
                height={600}
                className="w-full rounded-lg shadow-sm"
              />
            </div>
          </div>
        ) : (
          invoice.status === "pending" && (
            <div className="mt-4">
              <Label>{t("invoices.paymentProof")}</Label>
              <div className="flex flex-col gap-4">
                <CldUploadButton
                  uploadPreset={uploadPreset}
                  onSuccess={handlePaymentProofUpload}
                  options={{
                    cloudName,
                    maxFiles: 1,
                    sources: ["local", "url", "camera"],
                    clientAllowedFormats: [
                      "jpg",
                      "jpeg",
                      "png",
                      "webp",
                      "pdf",
                    ],
                    maxFileSize: 10 * 1024 * 1024,
                    multiple: false,
                    folder: "payment-proofs",
                  }}
                  className="bg-[#535C91] hover:bg-[#424874] text-white py-2 px-6 rounded-lg mb-2 text-center cursor-pointer"
                >
                  {paymentProofUrl || invoice.paymentProofUrl
                    ? t("invoices.reuploadProof")
                    : t("invoices.uploadProof")}
                </CldUploadButton>

                {(paymentProofUrl || invoice.paymentProofUrl) && (
                  <div className="mt-2">
                    <Image
                      src={paymentProofUrl || invoice.paymentProofUrl || ""}
                      alt={t("invoices.paymentProof")}
                      width={320}
                      height={160}
                      className="max-h-40 rounded shadow"
                      unoptimized
                    />
                    <div className="text-xs text-gray-500 mt-1 break-all">
                      {paymentProofUrl || invoice.paymentProofUrl}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !paymentProofUrl}
                  className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("invoices.submitting")}
                    </>
                  ) : (
                    t("invoices.submitPaymentProof")
                  )}
                </Button>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCloudinary } from "@/components/providers/CloudinaryProvider";
import {
  CldUploadButton,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import Image from "next/image";

export default function OfflinePayment() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const periodInvoiceNumber = searchParams?.get("periodInvoice") ?? null;
  const { cloudName, uploadPreset } = useCloudinary();

  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/login?callbackUrl=/checkout/offline-payment?periodInvoice=${periodInvoiceNumber}`
      );
      return;
    }

    setIsLoading(false);
  }, [status, router, periodInvoiceNumber]);

  useEffect(() => {
    // Fetch invoice details if it's a period invoice
    const fetchInvoice = async () => {
      if (periodInvoiceNumber && status === "authenticated") {
        try {
          const response = await axios.get(
            `/api/invoices/${periodInvoiceNumber}`
          );
          setInvoice(response.data.invoice);
        } catch (error) {
          console.error("Error fetching invoice:", error);
          toast.error(t("checkout.errorFetchingInvoice"));
        }
      }
    };

    fetchInvoice();
  }, [periodInvoiceNumber, status, t]);

  const handlePaymentProofUpload = (result: CloudinaryUploadWidgetResults) => {
    console.log("Upload result:", result);
    if (
      result.info &&
      typeof result.info === "object" &&
      "secure_url" in result.info
    ) {
      console.log("Setting URL:", result.info.secure_url);
      setPaymentProofUrl(result.info.secure_url as string);
      toast.success("Upload successful!");
    } else {
      console.error("Invalid upload result:", result);
      toast.error("Upload failed - invalid result");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!paymentProofUrl || !paymentReference || !paymentDate) {
      toast.error(t("checkout.fillAllFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Attach the payment proof to the existing period invoice (same pattern
      // as the invoice detail page) instead of creating a new order.
      const response = await axios.patch(
        `/api/invoices/${periodInvoiceNumber}`,
        {
          paymentProofUrl,
          paymentReference,
          paymentDate,
        }
      );

      if (response.data) {
        toast.success(t("checkout.offlinePaymentSubmitted"));
        router.push("/invoices");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error(t("checkout.errorSubmittingPayment"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t("checkout.offlinePayment")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {invoice && (
              <div className="mb-6">
                <h3 className="font-medium">{t("checkout.invoiceDetails")}</h3>
                <p>
                  {t("checkout.invoiceNumber")}: {invoice.invoiceNumber}
                </p>
                <p>
                  {t("checkout.amount")}: ${invoice.amount}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="paymentReference">
                {t("checkout.paymentReference")}
              </Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder={t("checkout.enterPaymentReference")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">{t("checkout.paymentDate")}</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("checkout.paymentProof")}</Label>
              <div className="flex justify-end">
                <CldUploadButton
                  uploadPreset={uploadPreset}
                  onSuccess={handlePaymentProofUpload}
                  options={{
                    cloudName,
                    maxFiles: 1,
                    sources: ["local", "url", "camera"],
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"],
                    maxFileSize: 10 * 1024 * 1024,
                    multiple: false,
                    folder: "payment-proofs",
                  }}
                >
                  <div className="bg-[#535C91] hover:bg-[#424874] text-white py-2 px-6 rounded-lg mb-2 text-center cursor-pointer">
                    {paymentProofUrl
                      ? t("checkout.reuploadFile")
                      : t("checkout.uploadFile")}
                  </div>
                </CldUploadButton>
              </div>
              {paymentProofUrl && (
                <div className="mt-2">
                  <Image
                    src={paymentProofUrl}
                    alt={t("checkout.paymentProof")}
                    width={320}
                    height={160}
                    className="max-h-40 rounded shadow"
                    unoptimized
                  />
                  <div className="text-xs text-gray-500 mt-1 break-all">
                    {paymentProofUrl}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !paymentProofUrl}
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black"
            >
              {isSubmitting
                ? t("checkout.submitting")
                : t("checkout.submitPayment")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

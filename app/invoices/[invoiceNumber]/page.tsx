"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import PrintableInvoice from "@/components/PrintableInvoice";
import { toast } from "react-hot-toast";
import { CloudinaryUploadWidgetResults } from "next-cloudinary";
import { useCloudinary } from "@/hooks/useCloudinary";
import { useUser } from "@/providers/user/UserContext";
import InvoiceInfoCard from "./components/InvoiceInfoCard";
import OrderSummaryCard from "./components/OrderSummaryCard";
import PaymentInfoCard from "./components/PaymentInfoCard";
import AddressesCard from "./components/AddressesCard";
import type { Invoice } from "./invoiceTypes";

export default function InvoiceDetailPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userData, loading: userLoading } = useUser();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const { cloudName, uploadPreset } = useCloudinary();
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useParams() as { invoiceNumber: string };
  const invoiceNumber = params.invoiceNumber;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/invoices");
    }
  }, [status, router]);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${invoiceNumber}`);
      setInvoice(response.data.invoice);
    } catch (error: any) {
      console.error("Error fetching invoice:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      if (error.response?.data?.error) {
        toast.error(
          t(`invoice.errors.${error.response.data.error}`) ||
            error.response.data.error
        );
      } else {
        toast.error(t("invoice.error.fetch"));
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber, t]);

  useEffect(() => {
    if (userData && !userLoading) {
      fetchInvoice();
    }
  }, [userData, userLoading, fetchInvoice]);

  const formatInvoiceAddress = (address: any) => {
    if (!address) {
      // Use user's address if no specific address is provided
      return invoice?.user?.address?.[language] || "N/A";
    }
    return address[language] || invoice?.user?.address?.[language] || "N/A";
  };

  const handleDownloadDoc = async (asReceipt: boolean) => {
    try {
      const docParam = asReceipt ? "&doc=receipt" : "";
      const res = await fetch(
        `/api/invoices/${invoiceNumber}/download?lang=${language}${docParam}`
      );
      if (!res.ok) throw new Error("Failed to download document");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${asReceipt ? "receipt" : "invoice"}-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error(t("invoice.error.fetch"));
    }
  };

  const handlePaymentProofUpload = (result: CloudinaryUploadWidgetResults) => {
    if (!result.info) {
      toast.error(t("invoices.uploadError"));
      return;
    }

    if (typeof result.info === "object" && "secure_url" in result.info) {
      const uploadedUrl = result.info.secure_url as string;
      setPaymentProofUrl(uploadedUrl);

      // Update invoice with payment proof
      if (invoice) {
        axios
          .patch(`/api/invoices/${invoice.invoiceNumber}`, {
            paymentProofUrl: uploadedUrl,
            paymentDate: new Date().toISOString(),
          })
          .then((response) => {
            if (response.data.success) {
              setInvoice(response.data.invoice);
              toast.success(t("invoices.paymentProofUploaded"));
            }
          })
          .catch((error) => {
            console.error("Error updating invoice with payment proof:", error);
            toast.error(t("invoices.uploadError"));
          });
      }
    } else {
      console.error("Invalid upload result:", result);
      toast.error(t("invoices.uploadError"));
    }
  };

  const handleSubmit = async () => {
    if (!invoice || isSubmitting) return;
    if (!paymentProofUrl) {
      toast.error(t("invoices.uploadProofFirst"));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.patch(
        `/api/invoices/${invoice.invoiceNumber}`,
        {
          paymentProofUrl,
          paymentDate: new Date().toISOString(),
        }
      );

      if (response.data.success) {
        setInvoice(response.data.invoice);
        toast.success(t("invoices.paymentProofUploaded"));
      }
    } catch (error) {
      console.error("Error updating invoice with payment proof:", error);
      toast.error(t("invoices.uploadError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || userLoading) {
    return <div>{t("common.loading")}</div>;
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t("invoices.notFound")}</div>
      </div>
    );
  }

  return (
    <>
      {/* Regular invoice view */}
      <div className={isPrinting ? "hidden" : ""}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/invoices")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("order-details.navigation.back")}
            </Button>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-bold mb-2">
                  {t("order-details.page.title", {
                    number: invoice?.invoiceNumber,
                  })}
                </h1>
                {invoice?.periodInvoiceNumber && (
                  <p className="text-lg text-gray-600">
                    {t("invoices.periodInvoice")}: {invoice.periodInvoiceNumber}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDoc(false)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {language === "zh-TW" ? "下載發票" : "Invoice"}
                </Button>
                {invoice?.status === "paid" && (
                  <Button variant="default" onClick={() => handleDownloadDoc(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    {language === "zh-TW" ? "下載收據" : "Receipt"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Invoice Details */}
            <div className="lg:col-span-2 space-y-6">
              <InvoiceInfoCard invoice={invoice} />
              <OrderSummaryCard invoice={invoice} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <PaymentInfoCard
                invoice={invoice}
                paymentProofUrl={paymentProofUrl}
                isSubmitting={isSubmitting}
                cloudName={cloudName}
                uploadPreset={uploadPreset}
                handlePaymentProofUpload={handlePaymentProofUpload}
                handleSubmit={handleSubmit}
              />
              <AddressesCard
                invoice={invoice}
                formatInvoiceAddress={formatInvoiceAddress}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable version */}
      {isPrinting && (
        <div className="printable-invoice">
          <PrintableInvoice
            invoice={invoice}
            formatInvoiceAddress={formatInvoiceAddress}
          />
        </div>
      )}

      {/* Hidden printable version */}
      <div id="printable-invoice" style={{ display: "none" }}>
        <PrintableInvoice
          invoice={invoice}
          formatInvoiceAddress={formatInvoiceAddress}
        />
      </div>
    </>
  );
}

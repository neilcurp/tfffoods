"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, ShoppingCart, Plus, Minus, Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import secureCheckout from "@/public/securecheckout.png";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import useCartStore from "../../store/cartStore";
import { CartItem } from "@/types";
import { useCloudinary } from "@/components/providers/CloudinaryProvider";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";
import {
  CldUploadButton,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../providers/user/UserContext";
import type { Address } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type } from "os";

// Update DeliverySettings interface
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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function CheckoutPage() {
  const { t, language } = useTranslation();
  const confirm = useConfirm();
  const { data: session, status } = useSession();
  const { userData, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const periodInvoiceNumber = searchParams?.get("periodInvoice") ?? null;
  const [periodInvoice, setPeriodInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cart store hooks - consolidated here
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const selectedDeliveryType = useCartStore(
    (state) => state.selectedDeliveryType
  );
  const setSelectedDeliveryType = useCartStore(
    (state) => state.setSelectedDeliveryType
  );

  const [selectedDeliveryMethod, setSelectedDeliveryMethod] =
    useState<number>(selectedDeliveryType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // Change to string type
  const [streetAddress, setStreetAddress] = useState("");
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    deliveryMethods: [],
    freeDeliveryThreshold: 0,
    bankAccountDetails: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<
    "online" | "offline" | "periodInvoice"
  >("online");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const { cloudName, uploadPreset } = useCloudinary();
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [addressOption, setAddressOption] = useState<"profile" | "custom">(
    "profile"
  );
  const [customAddress, setCustomAddress] = useState<Address>({
    en: "",
    "zh-TW": "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  // Initialize form with user data
  useEffect(() => {
    if (userData && !userLoading) {
      setName(userData.name || "");
      setEmail(userData.email || "");
      if (userData.phone) {
        setPhone(userData.phone); // No need to convert to number
      }
      if (userData.address) {
        setStreetAddress(userData.address.en || "");
      }
    }
  }, [userData, userLoading]);

  // When switching to profile address, fill simplified fields and lock them
  useEffect(() => {
    if (addressOption === "profile" && userData?.address) {
      const userAddress = userData.address;
      setStreetAddress(userAddress.en || "");
    } else if (addressOption === "custom") {
      setCustomAddress({
        en: "",
        "zh-TW": "",
      });
      setStreetAddress("");
    }
  }, [addressOption, userData?.address]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setCustomAddress({
      ...customAddress,
      en: value,
      "zh-TW": value,
    });
    setStreetAddress(value);
  };

  // Initialize delivery method from cart store
  useEffect(() => {
    if (selectedDeliveryType !== undefined) {
      console.log("Initializing delivery method:", {
        selectedDeliveryType,
        type: typeof selectedDeliveryType,
        converted: Number(selectedDeliveryType),
      });
      setSelectedDeliveryMethod(Number(selectedDeliveryType));
    }
  }, [selectedDeliveryType]);

  // Load delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await fetch("/api/delivery");
        const data = await response.json();
        setDeliverySettings(data);
        // Set initial delivery method from cart store
        if (selectedDeliveryType !== undefined) {
          console.log("Setting initial delivery method:", {
            selectedDeliveryType,
            type: typeof selectedDeliveryType,
            converted: Number(selectedDeliveryType),
          });
          setSelectedDeliveryMethod(Number(selectedDeliveryType));
        }
      } catch (error) {
        console.error("Failed to fetch delivery settings:", error);
        toast.error(t("errors.fetchDeliverySettings"));
      }
    };
    fetchDeliverySettings();
  }, [t, selectedDeliveryType]);

  useEffect(() => {
    const fetchPeriodInvoice = async () => {
      if (periodInvoiceNumber) {
        try {
          const response = await axios.get(
            `/api/invoices/${periodInvoiceNumber}`
          );
          setPeriodInvoice(response.data.invoice);
          // For period invoices, we use the invoice total and don't touch cart
          if (response.data.invoice.invoiceType === "period") {
            setPaymentMethod("periodInvoice");
          }
        } catch (error) {
          console.error("Error fetching period invoice:", error);
          toast.error(t("checkout.errorFetchingInvoice"));
        }
      }
    };
    fetchPeriodInvoice();
  }, [periodInvoiceNumber, t]);

  useEffect(() => {
    if (paymentMethod === "offline") {
      // Generate a unique reference number (e.g., IOP-YYYYMMDD-XXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      setPaymentReference(`IOP-${dateStr}-${random}`);
    }
  }, [paymentMethod]);

  useEffect(() => {
    // Track form changes
    const formHasChanges =
      name !== "" ||
      email !== (userData?.email || "") ||
      streetAddress !== "" ||
      paymentProofUrl !== "" ||
      paymentDate !== "";

    setHasFormChanges(formHasChanges);
  }, [
    name,
    email,
    streetAddress,
    paymentProofUrl,
    paymentDate,
    userData?.email,
  ]);

  // Update delivery type in cart store when changed in checkout
  const handleDeliveryMethodChange = (value: string) => {
    const methodIndex = parseInt(value, 10);
    console.log("Delivery method change:", {
      value,
      methodIndex,
      isNaN: isNaN(methodIndex),
      currentMethod: selectedDeliveryMethod,
      currentType: selectedDeliveryType,
    });
    if (
      !isNaN(methodIndex) &&
      methodIndex >= 0 &&
      methodIndex < deliverySettings.deliveryMethods.length
    ) {
      console.log("Setting delivery method:", {
        value,
        methodIndex,
        currentMethod: selectedDeliveryMethod,
        currentType: selectedDeliveryType,
      });
      setSelectedDeliveryMethod(methodIndex);
      setSelectedDeliveryType(methodIndex);
    }
  };

  // Calculate delivery cost based on selected method
  const calculateDeliveryCost = () => {
    if (!deliverySettings.deliveryMethods.length) return 0;

    const subtotal = getTotalPrice();
    if (subtotal >= deliverySettings.freeDeliveryThreshold) return 0;

    const selectedMethod =
      deliverySettings.deliveryMethods[selectedDeliveryMethod];
    return selectedMethod ? selectedMethod.cost : 0;
  };

  const deliveryCost = calculateDeliveryCost();

  interface ShippingData {
    name: string;
    email: string;
    phone: string; // Change to string type
    shippingAddress: {
      en: string;
      "zh-TW": string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    cartItems: Array<{
      id: string;
      quantity: number;
      price: number;
    }>;
    deliveryMethod: number;
    paymentMethod: "online" | "offline" | "periodInvoice";
    paymentProofUrl?: string;
    paymentReference?: string;
    paymentDate?: string;
  }

  const handleCheckout = async () => {
    try {
      // Validate required fields
      if (!name || !email || !phone) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      // Validate phone number format
      if (!/^\d{8,}$/.test(phone.toString())) {
        toast.error(t("checkout.invalidPhoneNumber"));
        return;
      }

      // Prepare address data
      const addressToUse =
        addressOption === "profile" ? userData?.address : customAddress;
      if (!addressToUse || (!addressToUse.en && !addressToUse["zh-TW"])) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      // Validate delivery settings
      if (!deliverySettings.deliveryMethods.length) {
        toast.error(t("checkout.error.deliverySettings"));
        return;
      }

      // Validate delivery method
      if (
        selectedDeliveryMethod < 0 ||
        selectedDeliveryMethod >= deliverySettings.deliveryMethods.length
      ) {
        toast.error(t("checkout.error.deliveryMethod"));
        return;
      }

      const shippingData: ShippingData = {
        name,
        email,
        phone: Number(phone), // Ensure phone is converted to number
        shippingAddress: {
          en: addressToUse.en || "",
          "zh-TW": addressToUse["zh-TW"] || "",
          coordinates: addressToUse.coordinates || undefined,
        },
        cartItems: items.map((item) => ({
          id: item._id, // Use product._id instead of _id
          quantity: item.quantity,
          price: item.price, // Include product price
        })),
        deliveryMethod: Number(selectedDeliveryMethod), // Ensure it's a number
        paymentMethod: "online",
      };

      // Create an order in our system first
      const response = await axios.post("/api/checkout", shippingData);
      if (!response.data?.success || !response.data?.orderId) {
        toast.error(t("checkout.error"));
        return;
      }

      // Prefer server-side redirect route for maximum compatibility
      window.location.href = `/api/stripe/checkout-redirect?orderId=${response.data.orderId}`;
      return;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("checkout.error"));
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
    } else {
      updateItemQuantity(itemId, newQuantity);
    }
  };

  const renderEmailField = () => {
    if (userData?.email) {
      return (
        <input
          type="email"
          value={email}
          readOnly
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
      );
    } else {
      return (
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      );
    }
  };

  const handlePaymentProofUpload = (result: CloudinaryUploadWidgetResults) => {
    if (!result.info) {
      toast.error(t("checkout-page.payment.proof.error.upload"));
      return;
    }

    if (typeof result.info === "object" && "secure_url" in result.info) {
      setPaymentProofUrl(result.info.secure_url as string);
      toast.success(t("checkout-page.payment.proof.success"));
    } else {
      console.error("Invalid upload result:", result);
      toast.error(t("checkout-page.payment.proof.error.invalid"));
    }
  };

  const handleOfflinePayment = async () => {
    try {
      // Validate required fields
      if (!name || !email || !phone) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      // Validate phone number format
      if (!/^\d{8,}$/.test(phone.toString())) {
        toast.error(t("checkout.invalidPhoneNumber"));
        return;
      }

      // Prepare address data
      const addressToUse =
        addressOption === "profile" ? userData?.address : customAddress;
      if (!addressToUse || (!addressToUse.en && !addressToUse["zh-TW"])) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      // For offline payment, validate payment proof
      if (!paymentProofUrl) {
        toast.error(t("checkout.payment.proof.required"));
        return;
      }

      // Debug log delivery settings
      console.log("Delivery settings:", {
        deliverySettings,
        selectedDeliveryMethod,
        selectedDeliveryType,
        deliveryMethods: deliverySettings.deliveryMethods,
        methodType: typeof selectedDeliveryMethod,
        typeType: typeof selectedDeliveryType,
      });

      // Validate delivery settings
      if (!deliverySettings.deliveryMethods.length) {
        toast.error(t("checkout.error.deliverySettings"));
        return;
      }

      // Validate delivery method
      if (
        selectedDeliveryMethod < 0 ||
        selectedDeliveryMethod >= deliverySettings.deliveryMethods.length
      ) {
        toast.error(t("checkout.error.deliveryMethod"));
        return;
      }

      const shippingData: ShippingData = {
        name,
        email,
        phone: Number(phone), // Ensure phone is converted to number
        shippingAddress: {
          en: addressToUse.en || "",
          "zh-TW": addressToUse["zh-TW"] || "",
          coordinates: addressToUse.coordinates || undefined,
        },
        cartItems: items.map((item) => ({
          id: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryMethod: Number(selectedDeliveryMethod), // Ensure it's a number
        paymentMethod: "offline",
        paymentProofUrl,
        paymentReference,
        paymentDate,
      };

      // Debug log shipping data with phone type
      console.log("Sending shipping data:", {
        ...shippingData,
        phone: {
          value: shippingData.phone,
          type: typeof shippingData.phone,
        },
        deliveryMethod: {
          value: shippingData.deliveryMethod,
          type: typeof shippingData.deliveryMethod,
        },
      });

      setIsSubmittingOffline(true);
      try {
        // Include CSRF token in headers
        const response = await axios.post("/api/checkout", shippingData, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        if (response.data.success) {
          // Don't clear cart for offline payments until admin confirms
          router.push(`/checkout/success?orderId=${response.data.orderId}`);
        }
      } finally {
        setIsSubmittingOffline(false);
      }
    } catch (error: any) {
      console.error("Offline payment error:", {
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
              data: error.config.data,
            }
          : "No config",
      });

      // Show specific error message if available
      if (error.response?.data?.error) {
        toast.error(
          t(`checkout.errors.${error.response.data.error}`) ||
            error.response.data.error
        );
      } else {
        toast.error(t("checkout.error"));
      }
    }
  };

  const handlePeriodPayment = async () => {
    try {
      // Validate required fields
      if (!name || !email || !phone) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      // Validate phone number format
      if (!/^\d{8,}$/.test(phone.toString())) {
        toast.error(t("checkout.invalidPhoneNumber"));
        return;
      }

      // Prepare address data
      const addressToUse =
        addressOption === "profile" ? userData?.address : customAddress;
      if (!addressToUse || (!addressToUse.en && !addressToUse["zh-TW"])) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      const shippingData = {
        name,
        email,
        phone: Number(phone),
        shippingAddress: {
          en: addressToUse.en || "",
          "zh-TW": addressToUse["zh-TW"] || "",
          coordinates: addressToUse.coordinates || null,
        },
        cartItems: items.map((item) => ({
          id: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryMethod: Number(selectedDeliveryMethod),
        paymentMethod: "periodInvoice",
      };

      console.log("Sending period payment data:", shippingData);

      const response = await axios.post("/api/checkout", shippingData);

      if (response.data.success) {
        // Don't clear cart yet - wait for admin approval
        router.push(`/checkout/success?orderId=${response.data.orderId}`);
      }
    } catch (error) {
      console.error("Period payment error:", error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(t("checkout.error"));
      }
    }
  };

  const handleCancelOfflinePayment = async () => {
    if (hasFormChanges) {
      const confirmed = await confirm({
        title: t("common.cancel"),
        description: t("common.confirmCancel"),
        confirmText: t("common.confirm"),
        cancelText: t("common.cancel"),
        destructive: false,
      });
      if (!confirmed) {
        return;
      }
    }

    // Reset form state
    setName("");
    setEmail(userData?.email || "");
    setStreetAddress("");
    setPaymentProofUrl("");
    setPaymentDate("");
    setPaymentMethod("online");

    // Clear any error states
    setIsSubmittingOffline(false);

    // Go to canceled page
    router.push("/checkout/canceled");
  };

  // Add beforeunload event handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasFormChanges) {
        e.preventDefault();
        e.returnValue = t("common.formNotSaved");
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasFormChanges, t]);

  const handleCancelClick = () => {
    if (hasFormChanges) {
      setShowCancelDialog(true);
    } else {
      handleCancelOfflinePayment();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setPhone(value); // Store as string
    }
  };

  if (userLoading) {
    return <div>{t("common.loading")}</div>;
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {t("checkout.thankYou")}
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          {t("checkout.orderConfirmation")}
        </p>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const total = periodInvoice
    ? periodInvoice.amount
    : getTotalPrice() + deliveryCost;

  const cancelDialog = (
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("common.confirmCancelTitle")}</DialogTitle>
          <DialogDescription>{t("common.confirmCancel")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <div className="flex gap-3 w-full">
            <Button
              variant="destructive"
              onClick={() => {
                setShowCancelDialog(false);
                handleCancelOfflinePayment();
              }}
            >
              {t("common.confirmCancelButton")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              {t("common.keepEditing")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          {t("checkout-page.title")}
        </h2>

        {/* Period-paid user message */}
        {userData?.isPeriodPaidUser && userData?.paymentPeriod && (
          <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            <strong>{t("checkout-page.periodUser.title")}</strong>
            <div>{t("checkout-page.periodUser.message")}</div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
              {t("checkout-page.emptyCart")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Products */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {t("checkout-page.orderSummary.title")}
              </h3>
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {items.map((item: CartItem) => (
                  <div
                    className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    key={`${item._id}-${Object.entries(
                      item.selectedSpecifications || {}
                    )
                      .map(([key, value]) => `${key}:${value}`)
                      .join(";")}`}
                  >
                    <Image
                      src={item?.images[0]}
                      width={80}
                      height={80}
                      className="rounded-md object-cover shadow-lg"
                      alt={item.displayNames?.[language] || item.name}
                      unoptimized
                    />
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {item.displayNames?.[language] || item.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("cart.basePrice")}: ${item.basePrice?.toFixed(2)}
                      </p>
                      {/* Show specifications */}
                      {Object.entries(item.selectedSpecifications || {}).map(
                        ([key, value]) => {
                          if (key.endsWith("_price")) return null;
                          return (
                            <p
                              key={key}
                              className="text-sm text-gray-500 dark:text-gray-400"
                            >
                              {t(`cart.specifications.${key}`)}:{" "}
                              {typeof value === "object"
                                ? value[language]
                                : value}
                              {item.selectedSpecifications?.[
                                `${key}_price`
                              ] && (
                                <span className="ml-2">
                                  {Number(
                                    item.selectedSpecifications[`${key}_price`]
                                  ) === 0
                                    ? t("common.free")
                                    : `+$${Number(
                                        item.selectedSpecifications[
                                          `${key}_price`
                                        ]
                                      ).toFixed(2)}`}
                                </span>
                              )}
                            </p>
                          );
                        }
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("product.brand.label")}:{" "}
                        {typeof item.brand === "string"
                          ? item.brand
                          : item.brand?.displayNames?.[language] ||
                            item.brand?.name}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item._id,
                              (item.quantity || 1) - 1
                            )
                          }
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <span className="mx-2 text-sm text-gray-700 dark:text-gray-300">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item._id,
                              (item.quantity || 1) + 1
                            )
                          }
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex justify-between text-lg text-gray-800 dark:text-gray-200">
                  <span>{t("checkout-page.orderSummary.subtotal")}:</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg text-gray-800 dark:text-gray-200">
                  <span>{t("checkout-page.orderSummary.delivery")}:</span>
                  <span className="font-semibold">
                    {deliveryCost === 0
                      ? t("shipping.free")
                      : `$${deliveryCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xl text-gray-800 dark:text-gray-200">
                  <span>{t("checkout-page.orderSummary.total")}:</span>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Checkout Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {t("checkout-page.shipping.title")}
              </h3>
              {/* Always show Full Name and Email above the address option toggle */}
              <input
                type="text"
                placeholder={t("checkout-page.shipping.address.fullName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={addressOption === "profile"}
                className={`w-full p-2 rounded mb-4 ${
                  addressOption === "profile"
                    ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white cursor-not-allowed"
                    : "bg-white dark:bg-gray-700 text-black dark:text-white"
                }`}
              />
              <input
                type="email"
                placeholder={t("checkout-page.shipping.address.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={addressOption === "profile"}
                className={`w-full p-2 rounded mb-4 ${
                  addressOption === "profile"
                    ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white cursor-not-allowed"
                    : "bg-white dark:bg-gray-700 text-black dark:text-white"
                }`}
              />
              <div>
                <Label htmlFor="phone">{t("checkout.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  pattern="\d*"
                  required
                  readOnly={addressOption === "profile"}
                  className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded ${
                    addressOption === "profile"
                      ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white cursor-not-allowed"
                      : "bg-white dark:bg-gray-700 text-black dark:text-white"
                  }`}
                  placeholder={t("checkout.phonePlaceholder")}
                />
              </div>
              {/* Address Option Toggle and Address Fields */}
              <div className="mb-4 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addressOption"
                    value="profile"
                    checked={addressOption === "profile"}
                    onChange={() => setAddressOption("profile")}
                  />
                  <span>{t("checkout-page.shipping.useProfile")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addressOption"
                    value="custom"
                    checked={addressOption === "custom"}
                    onChange={() => setAddressOption("custom")}
                  />
                  <span>{t("checkout-page.shipping.useDifferent")}</span>
                </label>
              </div>
              {/* Profile Address Display */}
              {addressOption === "profile" ? (
                <div className="space-y-2">
                  <textarea
                    value={userData?.address ? userData.address[language] : ""}
                    readOnly
                    className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 text-black dark:text-white cursor-not-allowed min-h-[80px]"
                    placeholder={t("address.fields.address")}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("address.english")}
                    </label>
                    <textarea
                      placeholder={t("address.enterEnglishAddress")}
                      className="w-full p-2 border rounded min-h-[80px]"
                      value={customAddress.en || ""}
                      onChange={handleAddressChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("address.chinese")}
                    </label>
                    <textarea
                      placeholder={t("address.enterChineseAddress")}
                      className="w-full p-2 border rounded min-h-[80px]"
                      value={customAddress["zh-TW"] || ""}
                      onChange={handleAddressChange}
                    />
                  </div>
                </div>
              )}

              {/* Delivery Options Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                  {t("checkout.shipping.deliveryOption")}
                </h3>
                <select
                  value={selectedDeliveryMethod}
                  onChange={(e) => handleDeliveryMethodChange(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {deliverySettings.deliveryMethods.map((method, index) => (
                    <option key={index} value={index}>
                      {method.name[language]} - ${method.cost.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as
                            | "online"
                            | "offline"
                            | "periodInvoice"
                        )
                      }
                      className="form-radio text-[#535C91]"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      {t("checkout-page.payment.method.online")}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="offline"
                      checked={paymentMethod === "offline"}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as
                            | "online"
                            | "offline"
                            | "periodInvoice"
                        )
                      }
                      className="form-radio text-[#535C91]"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      {t("checkout-page.payment.method.offline")}
                    </span>
                  </label>
                  {userData?.isPeriodPaidUser && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="periodInvoice"
                        checked={paymentMethod === "periodInvoice"}
                        onChange={(e) =>
                          setPaymentMethod(
                            e.target.value as
                              | "online"
                              | "offline"
                              | "periodInvoice"
                          )
                        }
                        className="form-radio text-[#535C91]"
                      />
                      <span className="text-gray-800 dark:text-gray-200">
                        {t("checkout-page.payment.method.period")}
                      </span>
                    </label>
                  )}
                </div>

                {paymentMethod === "offline" && (
                  <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div>
                      <Label htmlFor="paymentProof">
                        {t("checkout-page.payment.proof.title")}
                      </Label>
                      <div className="mt-2">
                        <CldUploadButton
                          onSuccess={handlePaymentProofUpload}
                          uploadPreset={uploadPreset}
                          options={{
                            folder: "payment-proofs",
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
                          }}
                          className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {paymentProofUrl ? (
                            <>{t("checkout-page.payment.proof.reupload")}</>
                          ) : (
                            <>{t("checkout-page.payment.proof.upload")}</>
                          )}
                        </CldUploadButton>
                        {paymentProofUrl && (
                          <div className="mt-4">
                            <Image
                              src={paymentProofUrl}
                              alt={t("checkout-page.payment.proof.preview")}
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
                    </div>
                    <div>
                      <Label htmlFor="paymentReference">
                        {t("checkout-page.payment.proof.reference")}
                      </Label>
                      <Input
                        id="paymentReference"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder={t("checkout-page.payment.proof.reference")}
                        required
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-1">
                        {t("checkout-page.payment.proof.bankDetails")}
                      </Label>
                      <div className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {deliverySettings.bankAccountDetails}
                      </div>
                    </div>
                    <div className="flex justify-between gap-4">
                      <Button
                        onClick={handleOfflinePayment}
                        disabled={isSubmittingOffline || items.length === 0}
                        className="flex-1 bg-[#535C91] hover:bg-[#424874] text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingOffline ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t("checkout-page.payment.buttons.submitting")}
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            {t("checkout-page.payment.buttons.submit")}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelClick}
                        disabled={isSubmittingOffline}
                        variant="outline"
                        className="flex-1 py-3 rounded-lg"
                      >
                        {t("checkout-page.payment.buttons.cancel")}
                      </Button>
                    </div>
                  </div>
                )}

                {paymentMethod === "periodInvoice" && (
                  <div className="space-y-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="text-yellow-800 dark:text-yellow-200 mb-2">
                      {t("checkout-page.payment.periodInvoice.description")}
                    </div>
                    <Button
                      onClick={handlePeriodPayment}
                      disabled={items.length === 0}
                      className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("checkout-page.payment.periodInvoice.button")}
                    </Button>
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  {paymentMethod === "online" && (
                    <Button
                      onClick={handleCheckout}
                      disabled={isCheckingOut || items.length === 0}
                      className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingOut ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t("checkout-page.payment.buttons.processing")}
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          {t("checkout-page.payment.buttons.payOnline")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-center items-center space-x-4">
                <Image
                  src={secureCheckout}
                  alt={t("checkout.securePayment")}
                  width={250}
                  height={250}
                  className="dark:opacity-90"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {cancelDialog}
    </div>
  );
}

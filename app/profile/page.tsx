"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/providers/user/UserContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Edit2,
  Save,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import OrdersList from "@/components/ui/OrdersList";
import { Wishlist } from "@/components/ui/Wishlist";
import SettingsComponent from "@/components/ui/Settings";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Separator } from "@/components/ui/separator";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAddress } from "@/utils/formatAddress";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { WishlistButton } from "@/components/ui/WishlistButton";
import type { AddressComponents } from "@/utils/formatAddress";
import type { CustomUser } from "@/types";
import InvoicesPage from "@/app/invoices/page";
import email from "next-auth/providers/email";
import ProfileInvoices from "@/components/ui/ProfileInvoices";

interface ProfileState {
  name: string;
  email: string;
  admin: boolean;
  role: "admin" | "accounting" | "logistics" | "user";
  phone: string;
  address: {
    en: string;
    "zh-TW": string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { t, language } = useTranslation();
  const { userData, loading: userLoading, refreshUserData } = useUser();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "profile";
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
    admin: false,
    role: "user",
    phone: "",
    address: {
      en: "",
      "zh-TW": "",
    },
  });

  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Add Google Maps loading check
  useEffect(() => {
    let mounted = true;

    const checkGoogleMapsLoaded = () => {
      try {
        if (typeof window !== "undefined") {
          if (window.google?.maps) {
            if (mounted) {
              setMapsLoaded(true);
            }
          } else {
            setTimeout(checkGoogleMapsLoaded, 100);
          }
        }
      } catch (err) {
        console.error("Error checking Google Maps:", err);
      }
    };

    checkGoogleMapsLoaded();

    return () => {
      mounted = false;
    };
  }, []);

  const handleGetCoordinates = async () => {
    if (!window.google) {
      toast.error(t("errors.googleMapsNotLoaded"));
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();

      // Use the English address for geocoding
      const fullAddress = profile.address.en;
      console.log("Geocoding address:", fullAddress);

      const results = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === "OK" && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        }
      );

      if (results[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        const coordinates = {
          lat: location.lat(),
          lng: location.lng(),
        };

        // Update profile with coordinates
        setProfile((prev: ProfileState) => ({
          ...prev,
          address: {
            ...prev.address,
            coordinates,
          },
        }));

        toast.success(t("profile.addressGeocoded"));
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast.error(t("errors.geocodingFailed"));
    }
  };

  // Memoize the profile data construction
  const newProfile = useMemo(() => {
    if (!userData) return null;

    const address = (userData.address || {
      en: "",
      "zh-TW": "",
    }) as ProfileState["address"];
    return {
      name: userData.name || session?.user?.name || "",
      email: userData.email || session?.user?.email || "",
      admin: userData.admin ?? session?.user?.admin ?? false,
      role: userData.role ?? session?.user?.role ?? "user",
      phone: userData.phone ?? "",
      address: {
        en: address.en || "",
        "zh-TW": address["zh-TW"] || "",
        coordinates: address.coordinates,
      },
    };
  }, [
    userData,
    session?.user?.name,
    session?.user?.email,
    session?.user?.admin,
    session?.user?.role,
  ]);

  useEffect(() => {
    if (newProfile) {
      // Only update state if the data is different
      setProfile((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(newProfile)) {
          return prev; // No change needed
        }
        return newProfile;
      });
    }
  }, [newProfile]);

  const handleEdit = () => setIsEditing(true);

  const handleAddressChange = (
    field: string,
    value: string | { lat: number; lng: number }
  ) => {
    setProfile((prev: ProfileState): ProfileState => {
      if (field === "coordinates") {
        return {
          ...prev,
          address: {
            ...prev.address,
            coordinates: value as { lat: number; lng: number },
          },
        };
      }
      return {
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      };
    });
  };

  const handleCoordinateChange = (type: "lat" | "lng", value: string) => {
    setProfile((prev: ProfileState): ProfileState => {
      const coords = prev.address.coordinates || { lat: 0, lng: 0 };
      return {
        ...prev,
        address: {
          ...prev.address,
          coordinates: {
            ...coords,
            [type]: parseFloat(value) || 0,
          },
        },
      };
    });
  };

  const handleSave = async () => {
    if (!isEditing) return;

    // Validate phone number if provided
    if (profile.phone && !/^\d{8,}$/.test(profile.phone)) {
      toast.error(t("profile.invalidPhoneNumber"));
      return;
    }

    setIsEditing(false);
    try {
      // Prepare address data, omitting coordinates if not present
      const addressData = {
        en: profile.address.en,
        "zh-TW": profile.address["zh-TW"],
        ...(profile.address.coordinates && {
          coordinates: profile.address.coordinates,
        }),
      };

      console.log("Saving address data:", addressData);

      const res = await axios.put("/api/updateUser", {
        email: profile.email,
        name: profile.name,
        phone: profile.phone || "",
        address: addressData,
      });

      console.log("API response:", res.data);

      if (res.status === 200) {
        const updatedSession = {
          ...session,
          user: {
            ...session?.user,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            address: addressData,
          },
        };
        console.log("Updating session with:", updatedSession);
        await update(updatedSession);
        console.log("Session updated, refreshing user data...");
        await refreshUserData();
        toast.success(t("profile.updateSuccess"));
      } else {
        toast.error(t("common.error"));
      }
    } catch (error: any) {
      console.error("Save error:", error);
      // Show more specific error message if available
      const errorMessage = error.response?.data?.message || t("common.error");
      toast.error(errorMessage);
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup function to prevent state updates after unmount
      setIsEditing(false);
    };
  }, []);

  // Add effect to handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsEditing(false);
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const renderAddressSection = () => (
    <div className="space-y-4">
      {isEditing ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("address.english")}
            </label>
            <Input
              value={profile.address.en}
              onChange={(e) => handleAddressChange("en", e.target.value)}
              placeholder={t("address.enterEnglishAddress")}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("address.chinese")}
            </label>
            <Input
              value={profile.address["zh-TW"]}
              onChange={(e) => handleAddressChange("zh-TW", e.target.value)}
              placeholder={t("address.enterChineseAddress")}
              className="w-full"
            />
          </div>
          <div className="hidden">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("address.latitude")}
              </label>
              <Input
                type="number"
                step="0.0000001"
                value={profile.address.coordinates?.lat ?? ""}
                onChange={(e) => handleCoordinateChange("lat", e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("address.longitude")}
              </label>
              <Input
                type="number"
                step="0.0000001"
                value={profile.address.coordinates?.lng ?? ""}
                onChange={(e) => handleCoordinateChange("lng", e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <Button
            onClick={handleGetCoordinates}
            className="w-full bg-[#535C91] hover:bg-[#424874] text-white"
            disabled={!profile.address.en}
          >
            {t("address.getCoordinates")}
          </Button>
        </>
      ) : (
        <div className="text-gray-600 dark:text-gray-300">
          <p>
            {language === "en" ? profile.address.en : profile.address["zh-TW"]}
          </p>
        </div>
      )}
    </div>
  );

  const renderProfileContent = () => (
    <Card className="w-full shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
        <h2 className="text-3xl font-bold text-white">
          {t("common.personalInfo")}
        </h2>
      </CardHeader>
      <CardContent
        className="p-6 space-y-4"
        style={{ backgroundColor: "hsla(var(--card), var(--card-opacity, 1))" }}
      >
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("navigation.account")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.clickToUpdate")}
          </p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div
            className="flex items-center space-x-4 p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: "hsla(var(--card), var(--card-opacity, 0.5))",
            }}
          >
            <UserIcon className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            {isEditing ? (
              <Input
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="flex-grow bg-white dark:bg-gray-800 border-2 border-[#535C91] dark:border-[#6B74A9] focus:border-[#535C91] dark:focus:border-[#6B74A9] rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100"
                placeholder={t("common.fullName")}
              />
            ) : (
              <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
                {profile.name}
              </span>
            )}
          </div>
          <div
            className="flex items-center space-x-4 p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: "hsla(var(--card), var(--card-opacity, 0.5))",
            }}
          >
            <Mail className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            {isEditing ? (
              <Input
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="flex-grow bg-white dark:bg-gray-800 border-2 border-[#535C91] dark:border-[#6B74A9] focus:border-[#535C91] dark:focus:border-[#6B74A9] rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100"
                placeholder={t("common.email")}
              />
            ) : (
              <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
                {profile.email}
              </span>
            )}
          </div>
          <div
            className="flex items-center space-x-4 p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: "hsla(var(--card), var(--card-opacity, 0.5))",
            }}
          >
            <Phone className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            {isEditing ? (
              <Input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="flex-grow bg-white dark:bg-gray-800 border-2 border-[#535C91] dark:border-[#6B74A9] focus:border-[#535C91] dark:focus:border-[#6B74A9] rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100"
                placeholder={t("common.phone")}
              />
            ) : (
              <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
                {profile.phone || t("common.noPhoneNumber")}
              </span>
            )}
          </div>
          <div
            className="flex items-center space-x-4 p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: "hsla(var(--card), var(--card-opacity, 0.5))",
            }}
          >
            <ShieldCheck className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
              {t("common.role")}:{" "}
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              {profile.admin && ` (${t("navigation.admin")})`}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("address.fields.address")}
          </h3>
          {renderAddressSection()}
        </div>
      </CardContent>
      <CardFooter
        className="p-6 flex justify-end"
        style={{ backgroundColor: "hsla(var(--card), var(--card-opacity, 1))" }}
      >
        {isEditing ? (
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{t("common.saveChanges")}</span>
          </Button>
        ) : (
          <Button
            onClick={handleEdit}
            className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2"
          >
            <Edit2 className="w-5 h-5" />
            <span>{t("common.edit")}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  if (userLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar variant="inset" />
      <SidebarInset className="!ml-0 bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col">
            <div className="p-4 md:p-6">
              {activeTab === "profile" && renderProfileContent()}
              {activeTab === "orders" && <OrdersList />}
              {activeTab === "invoices" && <ProfileInvoices />}
              {activeTab === "wishlist" && <Wishlist />}
              {activeTab === "settings" && <SettingsComponent />}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

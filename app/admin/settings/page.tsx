"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetInfo,
} from "next-cloudinary";
import axios from "axios";
import toast from "react-hot-toast";
import { useStore } from "@/providers/store/StoreContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import router from "next/router";
import GeneralTab from "./tabs/GeneralTab";
import NewsletterTab from "./tabs/NewsletterTab";
import AboutTab from "./tabs/AboutTab";
import ContactTab from "./tabs/ContactTab";
import type {
  MultiLangValue,
  StoreSettings,
  AboutPageTeamMember,
  ContactPageOfficeLocation,
  ContactPageQuestion,
  AboutPageValue,
  ArrayItem,
  SectionType,
  SectionKey,
  SubsectionKey,
} from "./settingsTypes";

function isCloudinarySuccess(
  result: CloudinaryUploadWidgetResults
): result is { event: "success"; info: CloudinaryUploadWidgetInfo } {
  return (
    result?.event === "success" &&
    typeof result.info === "object" &&
    result.info !== null &&
    "secure_url" in result.info &&
    typeof result.info.secure_url === "string"
  );
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, getMultiLangValue } = useTranslation();
  const { refreshSettings } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general"); // Add state for active tab
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: {
      en: "EcomWatch",
      "zh-TW": "EcomWatch",
    },
    slogan: {
      en: "Your Luxury Watch Destination",
      "zh-TW": "您的奢華手錶目的地",
    },
    copyright: {
      en: "© 2024 EcomWatch. All rights reserved.",
      "zh-TW": "© 2024 EcomWatch. 保留所有權利。",
    },
    logo: "/logo.png",
    contactInfo: {
      email: "support@ecomwatch.com",
      phone: "(123) 456-7890",
    },
    businessHours: {
      weekdays: {
        en: "Mon-Fri: 9am-6pm",
        "zh-TW": "週一至週五: 上午9點至下午6點",
      },
      weekends: {
        en: "Sat-Sun: 10am-4pm",
        "zh-TW": "週六至週日: 上午10點至下午4點",
      },
    },
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
    shippingInfo: {
      standardDays: "5-7 business days",
      expressDays: "2-3 business days",
      internationalShipping: true,
      show: true,
      title: {
        en: "Shipping",
        "zh-TW": "運送",
      },
      standardShipping: {
        en: "Standard Shipping",
        "zh-TW": "標準運送",
      },
      expressShipping: {
        en: "Express Shipping",
        "zh-TW": "快速運送",
      },
    },
    returnPolicy: {
      daysToReturn: 30,
      conditions: {
        en: "Items must be unworn and in original condition with all tags attached.",
        "zh-TW": "商品必須未使用且保持原始狀態，所有標籤必須完整。",
      },
      show: true,
      title: {
        en: "Return Policy",
        "zh-TW": "退貨政策",
      },
    },
    newsletterSettings: {
      title: {
        en: "Subscribe to Our Newsletter",
        "zh-TW": "訂閱我們的電子報",
      },
      subtitle: {
        en: "Get 15% off your first order!",
        "zh-TW": "首次訂單可享85折優惠！",
      },
      bannerImage: "/newsletter.jpg",
      discountPercentage: 15,
      buttonText: {
        en: "Subscribe Now",
        "zh-TW": "立即訂閱",
      },
      disclaimer: {
        en: "By subscribing, you agree to receive email marketing. You can unsubscribe at any time.",
        "zh-TW": "訂閱即表示您同意接收電子郵件行銷。您可以隨時取消訂閱。",
      },
    },
    aboutPage: {
      title: {
        en: "About Us",
        "zh-TW": "關於我們",
      },
      subtitle: {
        en: "Our Story",
        "zh-TW": "我們的故事",
      },
      bannerImage: "/about-banner.jpg",
      story: {
        title: {
          en: "Our Story",
          "zh-TW": "我們的故事",
        },
        content: {
          en: "We've been in the business for over 20 years...",
          "zh-TW": "我們在這個行業已經超過20年...",
        },
        image: "/story-image.jpg",
      },
      values: {
        title: {
          en: "Our Values",
          "zh-TW": "我們的價值觀",
        },
        items: [
          {
            title: {
              en: "Innovation",
              "zh-TW": "創新",
            },
            description: {
              en: "We're always looking for new ways to improve",
              "zh-TW": "我們一直在尋找改進的新方法",
            },
            icon: "innovation.png",
          },
          {
            title: {
              en: "Quality",
              "zh-TW": "品質",
            },
            description: {
              en: "We're committed to the highest quality",
              "zh-TW": "我們致力於最高品質",
            },
            icon: "quality.png",
          },
          {
            title: {
              en: "Customer Service",
              "zh-TW": "客戶服務",
            },
            description: {
              en: "We're here to help you",
              "zh-TW": "我們在這裡為您服務",
            },
            icon: "customer-service.png",
          },
        ],
      },
      team: {
        title: {
          en: "Our Team",
          "zh-TW": "我們的團隊",
        },
        members: [
          {
            name: {
              en: "John Doe",
              "zh-TW": "John Doe",
            },
            role: {
              en: "CEO",
              "zh-TW": "執行長",
            },
            image: "/john-doe.jpg",
            description: {
              en: "John is the visionary behind our company",
              "zh-TW": "John是我們公司背後的遠見者",
            },
          },
          {
            name: {
              en: "Jane Smith",
              "zh-TW": "Jane Smith",
            },
            role: {
              en: "COO",
              "zh-TW": "營運長",
            },
            image: "/jane-smith.jpg",
            description: {
              en: "Jane is responsible for our operations",
              "zh-TW": "Jane負責我們的營運",
            },
          },
        ],
      },
    },
    contactPage: {
      title: { en: "", "zh-TW": "" },
      subtitle: { en: "", "zh-TW": "" },
      bannerImage: "",
      contactInfo: {
        title: { en: "", "zh-TW": "" },
        officeLocations: [
          {
            name: { en: "", "zh-TW": "" },
            address: { en: "", "zh-TW": "" },
            phone: "",
            email: "",
            hours: { en: "", "zh-TW": "" },
            coordinates: {
              lat: 0,
              lng: 0,
            },
          },
        ],
      },
      supportChannels: {
        title: { en: "", "zh-TW": "" },
        image: "",
        channels: [
          {
            title: { en: "", "zh-TW": "" },
            description: { en: "", "zh-TW": "" },
            icon: "",
          },
        ],
      },
      faq: {
        title: { en: "", "zh-TW": "" },
        questions: [
          {
            question: { en: "", "zh-TW": "" },
            answer: { en: "", "zh-TW": "" },
          },
        ],
      },
    },
  });

  const breadcrumbItems = [
    {
      label: t("navigation.admin"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.settings"),
      href: "/admin/settings",
      icon: SettingsIcon,
    },
  ];

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/store-settings");
        setSettings(response.data);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.admin) {
      fetchSettings();
    }
  }, [session]);

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
            // If Google Maps isn't loaded yet, check again in 100ms
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

  const handleInputChange = (
    value:
      | MultiLangValue
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section?: string
  ) => {
    if ("target" in value) {
      // Handle regular input change
      const { name, value: inputValue } = value.target;
      setSettings((prev) => {
        const newSettings = { ...prev };

        // Handle social media fields directly
        if (name.startsWith("socialMedia.")) {
          const field = name.split(".")[1];
          newSettings.socialMedia = {
            ...newSettings.socialMedia,
            [field]: inputValue,
          };
          return newSettings;
        }

        // Special cases for non-multilingual fields
        const nonMultiLangFields = [
          "icon",
          "image",
          "bannerImage",
          "logo",
          "discountPercentage",
          "daysToReturn",
          "internationalShipping",
          "phone",
          "email",
          "coordinates.lat",
          "coordinates.lng",
        ];

        // Check if this is a coordinates field
        const isCoordinates = name.includes("coordinates.");

        // Function to check if field should be multilingual
        const shouldBeMultiLingual = (fieldName: string) => {
          return !nonMultiLangFields.some(
            (field) => fieldName.includes(field) || fieldName.endsWith(field)
          );
        };

        if (section) {
          const parts = name.split(".");
          let current: any = newSettings[section as keyof typeof newSettings];

          // Handle array items (like officeLocations)
          if (parts.length > 2 && /\d+/.test(parts[1])) {
            const [arrayName, indexStr, ...rest] = parts;
            const index = parseInt(indexStr);
            const fieldName = rest.join(".");

            if (arrayName === "contactInfo.officeLocations") {
              const locations = [...current.contactInfo.officeLocations];

              if (isCoordinates) {
                // Handle coordinates separately
                const coordField = fieldName.split(".")[1];
                if (!locations[index].coordinates) {
                  locations[index].coordinates = { lat: 0, lng: 0 };
                }
                locations[index].coordinates[coordField as "lat" | "lng"] =
                  parseFloat(inputValue) || 0;
              } else if (shouldBeMultiLingual(fieldName)) {
                // Handle multilingual fields
                locations[index][fieldName] = {
                  en: inputValue,
                  "zh-TW": inputValue,
                };
              } else {
                // Handle non-multilingual fields
                locations[index][fieldName] = inputValue;
              }

              current.contactInfo.officeLocations = locations;
            }
          } else {
            // Handle non-array fields
            for (let i = 0; i < parts.length - 1; i++) {
              current = current[parts[i]];
            }

            const lastPart = parts[parts.length - 1];
            if (shouldBeMultiLingual(lastPart)) {
              current[lastPart] = {
                en: inputValue,
                "zh-TW": inputValue,
              };
            } else {
              current[lastPart] = inputValue;
            }
          }
        }

        return newSettings;
      });
    } else {
      // Handle MultiLangInput change
      setSettings((prev) => {
        if (!section) return prev;

        const newSettings = { ...prev };
        const sectionPath = section.split(".");
        let current: any = newSettings;

        for (let i = 0; i < sectionPath.length - 1; i++) {
          current = current[sectionPath[i]];
        }

        const lastKey = sectionPath[sectionPath.length - 1];
        current[lastKey] = value;

        return newSettings;
      });
    }
  };

  const handleLogoUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        logo: result.info.secure_url,
      }));
      toast.success("Logo uploaded successfully");
    } else {
      toast.error("Failed to upload logo");
    }
  };

  const handleNewsletterBannerUpload = (
    result: CloudinaryUploadWidgetResults
  ) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        newsletterSettings: {
          ...prev.newsletterSettings,
          bannerImage: result.info.secure_url,
        },
      }));
      toast.success("Newsletter banner uploaded successfully");
    } else {
      toast.error("Failed to upload newsletter banner");
    }
  };

  const handleAboutBannerUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        aboutPage: {
          ...prev.aboutPage,
          bannerImage: result.info.secure_url,
        },
      }));
      toast.success("About page banner uploaded successfully");
    } else {
      toast.error("Failed to upload about page banner");
    }
  };

  const handleStoryImageUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        aboutPage: {
          ...prev.aboutPage,
          story: {
            ...prev.aboutPage.story,
            image: result.info.secure_url,
          },
        },
      }));
      toast.success("Story image uploaded successfully");
    } else {
      toast.error("Failed to upload story image");
    }
  };

  const handleTeamMemberImageUpload = (
    result: CloudinaryUploadWidgetResults,
    index: number
  ) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => {
        const newMembers = [...prev.aboutPage.team.members];
        // Preserve all existing member data and only update the image
        newMembers[index] = {
          ...newMembers[index], // Keep all existing data
          image: result.info.secure_url, // Only update the image
        };

        return {
          ...prev,
          aboutPage: {
            ...prev.aboutPage,
            team: {
              ...prev.aboutPage.team,
              members: newMembers,
            },
          },
        };
      });

      toast.success("Team member image uploaded successfully");
    } else {
      toast.error("Failed to upload team member image");
    }
  };

  const handleContactBannerUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        contactPage: {
          ...prev.contactPage,
          bannerImage: result.info.secure_url,
        },
      }));
      toast.success("Contact page banner uploaded successfully");
    } else {
      toast.error("Failed to upload contact page banner");
    }
  };

  const handleSupportChannelsImageUpload = (
    result: CloudinaryUploadWidgetResults
  ) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        contactPage: {
          ...prev.contactPage,
          supportChannels: {
            ...prev.contactPage.supportChannels,
            image: result.info.secure_url,
          },
        },
      }));
      toast.success("Support channels image uploaded successfully");
    } else {
      toast.error("Failed to upload support channels image");
    }
  };

  const saveSettingsWithSync = async (settingsType: string) => {
    try {
      setIsLoading(true);

      // Validate settings before sending
      if (!settings) {
        toast.error(`Invalid settings data`);
        return;
      }

      const response = await axios.post("/api/store-settings", {
        settings: settings,
      });

      if (response.status === 200 && response.data) {
        setSettings(response.data.settings || response.data);
        await refreshSettings();
        toast.success(`${settingsType} settings saved successfully`);
      } else {
        console.error("Unexpected response:", response);
        toast.error(
          `Failed to save ${settingsType} settings: Invalid response`
        );
      }
    } catch (error: any) {
      console.error(`Error saving ${settingsType} settings:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to save ${settingsType} settings`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = () => saveSettingsWithSync("Store");
  const saveNewsletterSettings = () => saveSettingsWithSync("Newsletter");
  const saveAboutPageSettings = () => saveSettingsWithSync("About page");
  const saveContactPageSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/store-settings", {
        settings: {
          ...settings,
          contactPage: {
            ...settings.contactPage,
            contactInfo: settings.contactPage.contactInfo,
          },
        },
      });

      if (response.data) {
        setSettings(response.data);
        await refreshSettings();
        toast.success("Contact page settings saved successfully");
      }
    } catch (error) {
      console.error("Error saving contact page settings:", error);
      toast.error("Failed to save contact page settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArrayItem = <T extends SectionKey>(
    section: T,
    subsection: SubsectionKey<T>,
    arrayName: string,
    newItem: ArrayItem
  ) =>
    setSettings((prevSettings) => {
      const emptyMultiLangValue: MultiLangValue = { en: "", "zh-TW": "" };

      const toMultiLangValue = (
        value: string | MultiLangValue | undefined
      ): MultiLangValue => {
        if (!value) return emptyMultiLangValue;
        if (typeof value === "string") return { en: value, "zh-TW": value };
        return value;
      };

      let itemToAdd: ArrayItem;

      if ("name" in newItem && "address" in newItem) {
        // Handle office location
        const location = newItem as ContactPageOfficeLocation;
        itemToAdd = {
          name: toMultiLangValue(location.name),
          address: toMultiLangValue(location.address),
          phone: location.phone || "",
          email: location.email || "",
          hours: toMultiLangValue(location.hours),
          coordinates: location.coordinates || { lat: 0, lng: 0 },
        } as ContactPageOfficeLocation;
      } else if ("name" in newItem && "role" in newItem) {
        const member = newItem as AboutPageTeamMember;
        itemToAdd = {
          name: toMultiLangValue(member.name),
          role: toMultiLangValue(member.role),
          image: member.image || "/about1.jpg",
          description: toMultiLangValue(member.description),
        } as AboutPageTeamMember;
      } else if ("question" in newItem && "answer" in newItem) {
        const question = newItem as ContactPageQuestion;
        itemToAdd = {
          question: toMultiLangValue(question.question),
          answer: toMultiLangValue(question.answer),
        } as ContactPageQuestion;
      } else if (
        "title" in newItem &&
        "description" in newItem &&
        !("role" in newItem)
      ) {
        const value = newItem as AboutPageValue;
        itemToAdd = {
          title: toMultiLangValue(value.title),
          description: toMultiLangValue(value.description),
          icon: value.icon || "",
        } as AboutPageValue;
      } else {
        return prevSettings;
      }

      const sectionSettings = prevSettings[section] as SectionType[T];
      const subsectionSettings = sectionSettings[subsection] as Record<
        string,
        ArrayItem[]
      >;
      const currentArray = (subsectionSettings[arrayName] || []) as ArrayItem[];

      const newArray = [...currentArray, itemToAdd];

      return {
        ...prevSettings,
        [section]: {
          ...sectionSettings,
          [subsection]: {
            ...subsectionSettings,
            [arrayName]: newArray,
          },
        },
      };
    });

  const handleRemoveArrayItem = <T extends SectionKey>(
    section: T,
    subsection: SubsectionKey<T>,
    arrayName: string,
    index: number
  ) => {
    setSettings((prevSettings) => {
      const sectionSettings = prevSettings[section] as SectionType[T];
      const subsectionSettings = sectionSettings[subsection] as Record<
        string,
        ArrayItem[]
      >;
      const currentArray = (subsectionSettings[arrayName] || []) as ArrayItem[];

      const newArray = currentArray.filter((_, i) => i !== index);

      return {
        ...prevSettings,
        [section]: {
          ...sectionSettings,
          [subsection]: {
            ...subsectionSettings,
            [arrayName]: newArray,
          },
        },
      };
    });
  };

  const handleCoordinateUpdate = async (
    index: number,
    location: ContactPageOfficeLocation
  ) => {
    if (!window.google) {
      toast.error(
        "Google Maps is not loaded yet. Please refresh the page and try again."
      );
      return;
    }

    try {
      setIsLoading(true);
      const geocoder = new window.google.maps.Geocoder();
      const address = location.address.en;
      console.log("Geocoding address:", address);

      const results = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoder.geocode({ address: address }, (results, status) => {
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
        const newCoordinates = {
          lat: location.lat(),
          lng: location.lng(),
        };

        // Create a new settings object with updated coordinates
        const updatedSettings = { ...settings };
        const newLocations = [
          ...updatedSettings.contactPage.contactInfo.officeLocations,
        ];
        newLocations[index] = {
          ...newLocations[index],
          coordinates: newCoordinates,
        };
        updatedSettings.contactPage.contactInfo.officeLocations = newLocations;

        // Save to server first
        const response = await axios.post("/api/store-settings", {
          settings: updatedSettings,
        });

        if (response.data) {
          // Only update local state if server save was successful
          setSettings(response.data);
          await refreshSettings();
          toast.success("Location coordinates updated successfully");
        }
      } else {
        throw new Error("No location found for the given address");
      }
    } catch (error) {
      console.error("Error updating coordinates:", error);
      toast.error("Failed to update coordinates");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!session?.user?.admin) {
    router.push("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="bg-card rounded-lg shadow-sm p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("admin-settings.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("admin-settings.sections.store.description")}
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="general"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="general">
              {t("settings.tabs.general")}
            </TabsTrigger>
            <TabsTrigger value="newsletter">
              {t("settings.tabs.newsletter")}
            </TabsTrigger>
            <TabsTrigger value="about">{t("settings.tabs.about")}</TabsTrigger>
            <TabsTrigger value="contact">
              {t("settings.tabs.contact")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab
              settings={settings}
              setSettings={setSettings}
              handleInputChange={handleInputChange}
              handleLogoUpload={handleLogoUpload}
              saveSettings={saveSettings}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="newsletter">
            <NewsletterTab
              settings={settings}
              setSettings={setSettings}
              handleInputChange={handleInputChange}
              handleNewsletterBannerUpload={handleNewsletterBannerUpload}
              saveNewsletterSettings={saveNewsletterSettings}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="about">
            <AboutTab
              settings={settings}
              setSettings={setSettings}
              handleAddArrayItem={handleAddArrayItem}
              handleRemoveArrayItem={handleRemoveArrayItem}
              handleAboutBannerUpload={handleAboutBannerUpload}
              handleStoryImageUpload={handleStoryImageUpload}
              handleTeamMemberImageUpload={handleTeamMemberImageUpload}
              saveAboutPageSettings={saveAboutPageSettings}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="contact">
            <ContactTab
              settings={settings}
              setSettings={setSettings}
              handleInputChange={handleInputChange}
              handleContactBannerUpload={handleContactBannerUpload}
              handleSupportChannelsImageUpload={handleSupportChannelsImageUpload}
              handleAddArrayItem={handleAddArrayItem}
              handleRemoveArrayItem={handleRemoveArrayItem}
              handleCoordinateUpdate={handleCoordinateUpdate}
              saveContactPageSettings={saveContactPageSettings}
              isLoading={isLoading}
              mapsLoaded={mapsLoaded}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

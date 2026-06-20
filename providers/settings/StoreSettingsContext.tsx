"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cachedGet } from "@/utils/services/clientCache";

interface StoreSettings {
  storeName: {
    en: string;
    "zh-TW": string;
  };
  logo: string;
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  businessHours: {
    weekdays: {
      en: string;
      "zh-TW": string;
    };
    weekends: {
      en: string;
      "zh-TW": string;
    };
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  shippingInfo: {
    standardDays: string;
    expressDays: string;
    internationalShipping: boolean;
  };
  returnPolicy: {
    daysToReturn: number;
    conditions: {
      en: string;
      "zh-TW": string;
    };
  };
  newsletterSettings: {
    title: {
      en: string;
      "zh-TW": string;
    };
    subtitle: {
      en: string;
      "zh-TW": string;
    };
    bannerImage: string;
    discountPercentage: number;
    buttonText: {
      en: string;
      "zh-TW": string;
    };
    disclaimer: {
      en: string;
      "zh-TW": string;
    };
  };
  aboutPage: {
    title: {
      en: string;
      "zh-TW": string;
    };
    subtitle: {
      en: string;
      "zh-TW": string;
    };
    bannerImage: string;
    story: {
      title: {
        en: string;
        "zh-TW": string;
      };
      content: {
        en: string;
        "zh-TW": string;
      };
      image: string;
    };
    values: {
      title: string;
      items: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    team: {
      title: string;
      members: Array<{
        name: string;
        role: string;
        image: string;
        description: string;
      }>;
    };
  };
  contactPage: {
    title: {
      en: string;
      "zh-TW": string;
    };
    subtitle: {
      en: string;
      "zh-TW": string;
    };
    bannerImage: string;
    contactInfo: {
      title: string;
      officeLocations: Array<{
        name: string;
        address: string;
        phone: string;
        email: string;
        hours: string;
        coordinates?: {
          lat: number;
          lng: number;
        };
      }>;
    };
    supportChannels: {
      title: string;
      image: string;
      channels: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    faq: {
      title: {
        en: string;
        "zh-TW": string;
      };
      questions: Array<{
        question: {
          en: string;
          "zh-TW": string;
        };
        answer: {
          en: string;
          "zh-TW": string;
        };
      }>;
    };
  };
}

interface StoreSettingsContextType {
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: null,
  loading: true,
  error: null,
  refreshSettings: async () => {},
});

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error(
      "useStoreSettings must be used within a StoreSettingsProvider"
    );
  }
  return context;
};

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await cachedGet("/api/store-settings", { force });
      setSettings(data as StoreSettings);
      // Notify other components about the settings update
      window.dispatchEvent(new CustomEvent("settingsUpdate", { detail: data }));
    } catch (err) {
      console.error("Failed to fetch store settings:", err);
      setError("Failed to load store settings");
    } finally {
      setLoading(false);
    }
  };

  // Listen for settings updates from other parts of the application
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent<StoreSettings>) => {
      setSettings(event.detail);
    };

    window.addEventListener(
      "settingsUpdate",
      handleSettingsUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "settingsUpdate",
        handleSettingsUpdate as EventListener
      );
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: () => fetchSettings(true),
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

const defaultSettings: StoreSettings = {
  storeName: {
    en: "EcomWatch",
    "zh-TW": "EcomWatch",
  },
  logo: "/logo.png",
  contactInfo: {
    email: "support@ecomwatch.com",
    phone: "(123) 456-7890",
    address: {
      street: "123 Watch Street",
      city: "Timepiece City",
      postalCode: "TC 12345",
      country: "Switzerland",
    },
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
  },
  returnPolicy: {
    daysToReturn: 30,
    conditions: {
      en: "Items must be unworn and in original condition with all tags attached.",
      "zh-TW": "商品必須未使用且保持原始狀態，所有標籤必須完整。",
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
    bannerImage: "/about1.jpg",
    story: {
      title: {
        en: "Our Journey",
        "zh-TW": "我們的旅程",
      },
      content: {
        en: "We started our journey in 2020 with a vision to provide the best watches in the world. Since then, we've been committed to delivering excellence in every aspect of our business.",
        "zh-TW":
          "我們於2020年開始我們的旅程，目標是提供世界上最好的手錶。從那時起，我們一直致力於在業務的各個方面提供卓越的服務。",
      },
      image: "/about1.jpg",
    },
    values: {
      title: "Our Values",
      items: [
        {
          title: "Quality",
          description:
            "We use only the finest materials and craftsmanship to create our watches.",
          icon: "Star",
        },
        {
          title: "Innovation",
          description:
            "We're always looking for new ways to improve our products and services.",
          icon: "TrendingUp",
        },
        {
          title: "Customer Service",
          description:
            "We're here to help you every step of the way, from purchase to after-sales service.",
          icon: "Users",
        },
      ],
    },
    team: {
      title: "Our Team",
      members: [
        {
          name: "John Doe",
          role: "CEO",
          image: "/about1.jpg",
          description:
            "John has been with us since the beginning and is our fearless leader.",
        },
        {
          name: "Jane Smith",
          role: "Head of Design",
          image: "/about1.jpg",
          description:
            "Jane is responsible for creating our beautiful watches.",
        },
        {
          name: "Bob Johnson",
          role: "Head of Operations",
          image: "/about1.jpg",
          description:
            "Bob ensures everything runs smoothly behind the scenes.",
        },
      ],
    },
  },
  contactPage: {
    title: {
      en: "Contact Us",
      "zh-TW": "聯絡我們",
    },
    subtitle: {
      en: "Get in Touch with Our Team",
      "zh-TW": "與我們的團隊聯繫",
    },
    bannerImage: "/images/banner-default.svg",
    contactInfo: {
      title: "Our Offices",
      officeLocations: [
        {
          name: "SCF Office",
          address:
            "ROOM 1109, 11.F, SUN HING INSUTRIAL BUILDING, TUEN MUM, N.T",
          phone: "3435 3454",
          email: "info@testing.com",
          hours: "Mon-Fri: 9am-6pm\nSat: 10am-4pm\nSun: Closed",
          coordinates: {
            lat: 22.3927,
            lng: 113.9735,
          },
        },
        {
          name: "FED Office",
          address: "ROOM D, 3/F, BLOCK 25B, PARK YOHO, YUEN LONG, N.T",
          phone: "4564 3545",
          email: "home@testing.com",
          hours: "Mon-Fri: 9am-6pm\nSat: 10am-4pm\nSun: Closed",
          coordinates: {
            lat: 22.4433,
            lng: 114.0359,
          },
        },
      ],
    },
    supportChannels: {
      title: "Ways to Connect",
      image: "/images/support-default.svg",
      channels: [
        {
          title: "Live Chat",
          description: "Get instant help from our support team",
          icon: "MessageCircle",
        },
        {
          title: "Video Call",
          description: "Schedule a video consultation",
          icon: "Video",
        },
        {
          title: "Phone Support",
          description: "Talk to our customer service",
          icon: "Phone",
        },
      ],
    },
    faq: {
      title: {
        en: "Frequently Asked Questions",
        "zh-TW": "常見問題",
      },
      questions: [
        {
          question: {
            en: "What are your business hours?",
            "zh-TW": "你們的營業時間是？",
          },
          answer: {
            en: "We are open Monday to Friday from 9am to 6pm, and Saturday from 10am to 4pm.",
            "zh-TW":
              "我們週一至週五上午9點至下午6點營業，週六上午10點至下午4點營業。",
          },
        },
        {
          question: {
            en: "How can I track my order?",
            "zh-TW": "如何追蹤我的訂單？",
          },
          answer: {
            en: "You can track your order by logging into your account and visiting the order history section.",
            "zh-TW": "您可以登入您的帳戶並訪問訂單歷史記錄部分來追蹤您的訂單。",
          },
        },
      ],
    },
  },
};

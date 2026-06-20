"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cachedGet } from "@/utils/services/clientCache";

interface StoreSettings {
  storeName: {
    en: string;
    "zh-TW": string;
  };
  slogan: {
    en: string;
    "zh-TW": string;
  };
  copyright: {
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
    show: boolean;
    title: {
      en: string;
      "zh-TW": string;
    };
    standardShipping: {
      en: string;
      "zh-TW": string;
    };
    expressShipping: {
      en: string;
      "zh-TW": string;
    };
  };
  returnPolicy: {
    daysToReturn: number;
    conditions: {
      en: string;
      "zh-TW": string;
    };
    show: boolean;
    title: {
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
    backgroundColor?: string;
    textColor?: string;
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
      title: {
        en: string;
        "zh-TW": string;
      };
      items: Array<{
        title: {
          en: string;
          "zh-TW": string;
        };
        description: {
          en: string;
          "zh-TW": string;
        };
        icon: string;
      }>;
    };
    team: {
      title: {
        en: string;
        "zh-TW": string;
      };
      members: Array<{
        name: {
          en: string;
          "zh-TW": string;
        };
        role: {
          en: string;
          "zh-TW": string;
        };
        image: string;
        description: {
          en: string;
          "zh-TW": string;
        };
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
      title: {
        en: string;
        "zh-TW": string;
      };
      officeLocations: Array<{
        name: {
          en: string;
          "zh-TW": string;
        };
        address: {
          en: string;
          "zh-TW": string;
        };
        phone: string;
        email: string;
        hours: {
          en: string;
          "zh-TW": string;
        };
        coordinates?: {
          lat: number;
          lng: number;
        };
      }>;
    };
    supportChannels: {
      title: {
        en: string;
        "zh-TW": string;
      };
      image: string;
      channels: Array<{
        title: {
          en: string;
          "zh-TW": string;
        };
        description: {
          en: string;
          "zh-TW": string;
        };
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

interface StoreContextType {
  settings: StoreSettings;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: StoreSettings = {
  storeName: {
    en: "Loading...",
    "zh-TW": "載入中...",
  },
  slogan: {
    en: "Loading...",
    "zh-TW": "載入中...",
  },
  copyright: {
    en: "© {{year}} Loading...",
    "zh-TW": "© {{year}} 載入中...",
  },
  logo: "/images/placeholder-logo.png",
  contactInfo: {
    email: "loading@example.com",
    phone: "(000) 000-0000",
    address: {
      street: "Loading...",
      city: "Loading...",
      postalCode: "00000",
      country: "Loading...",
    },
  },
  businessHours: {
    weekdays: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    weekends: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
  },
  socialMedia: {
    facebook: "",
    instagram: "",
    twitter: "",
  },
  shippingInfo: {
    standardDays: "Loading...",
    expressDays: "Loading...",
    internationalShipping: false,
    show: false,
    title: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    standardShipping: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    expressShipping: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
  },
  returnPolicy: {
    daysToReturn: 0,
    conditions: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    show: false,
    title: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
  },
  newsletterSettings: {
    title: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    subtitle: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    bannerImage: "/images/banner-default.svg",
    discountPercentage: 0,
    buttonText: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    disclaimer: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    backgroundColor: "#f8f9fa",
    textColor: "#1a1a1a",
  },
  aboutPage: {
    title: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    subtitle: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    bannerImage: "/images/banner-default.svg",
    story: {
      title: {
        en: "Loading...",
        "zh-TW": "載入中...",
      },
      content: {
        en: "Loading...",
        "zh-TW": "載入中...",
      },
      image: "/images/support-default.svg",
    },
    values: {
      title: {
        en: "Loading...",
        "zh-TW": "載入中...",
      },
      items: [],
    },
    team: {
      title: {
        en: "Loading...",
        "zh-TW": "載入中...",
      },
      members: [],
    },
  },
  contactPage: {
    title: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    subtitle: {
      en: "Loading...",
      "zh-TW": "載入中...",
    },
    bannerImage: "/images/banner-default.svg",
    contactInfo: {
      title: {
        en: "Loading...",
        "zh-TW": "載入中...",
      },
      officeLocations: [],
    },
    supportChannels: {
      title: {
        en: "Loading...",
        "zh-TW": "載入中...",
      },
      image: "/images/support-default.svg",
      channels: [],
    },
    faq: {
      title: {
        en: "Loading...",
        "zh-TW": "載入中...",
      },
      questions: [],
    },
  },
};

const StoreContext = createContext<StoreContextType>({
  settings: defaultSettings,
  isLoading: true,
  error: null,
  refreshSettings: async () => {},
});

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async (force = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = { data: await cachedGet("/api/store-settings", { force }) };

      // Ensure all required fields exist with correct types
      const mergedSettings = {
        ...defaultSettings,
        ...res.data,
        storeName: {
          en: res.data.storeName?.en || defaultSettings.storeName.en,
          "zh-TW":
            res.data.storeName?.["zh-TW"] || defaultSettings.storeName["zh-TW"],
        },
        businessHours: {
          weekdays: {
            en:
              res.data.businessHours?.weekdays?.en ||
              defaultSettings.businessHours.weekdays.en,
            "zh-TW":
              res.data.businessHours?.weekdays?.["zh-TW"] ||
              defaultSettings.businessHours.weekdays["zh-TW"],
          },
          weekends: {
            en:
              res.data.businessHours?.weekends?.en ||
              defaultSettings.businessHours.weekends.en,
            "zh-TW":
              res.data.businessHours?.weekends?.["zh-TW"] ||
              defaultSettings.businessHours.weekends["zh-TW"],
          },
        },
        returnPolicy: {
          ...defaultSettings.returnPolicy,
          ...res.data.returnPolicy,
          conditions: {
            en:
              res.data.returnPolicy?.conditions?.en ||
              defaultSettings.returnPolicy.conditions.en,
            "zh-TW":
              res.data.returnPolicy?.conditions?.["zh-TW"] ||
              defaultSettings.returnPolicy.conditions["zh-TW"],
          },
        },
        newsletterSettings: {
          ...defaultSettings.newsletterSettings,
          ...res.data.newsletterSettings,
          title: {
            en:
              res.data.newsletterSettings?.title?.en ||
              defaultSettings.newsletterSettings.title.en,
            "zh-TW":
              res.data.newsletterSettings?.title?.["zh-TW"] ||
              defaultSettings.newsletterSettings.title["zh-TW"],
          },
          subtitle: {
            en:
              res.data.newsletterSettings?.subtitle?.en ||
              defaultSettings.newsletterSettings.subtitle.en,
            "zh-TW":
              res.data.newsletterSettings?.subtitle?.["zh-TW"] ||
              defaultSettings.newsletterSettings.subtitle["zh-TW"],
          },
          buttonText: {
            en:
              res.data.newsletterSettings?.buttonText?.en ||
              defaultSettings.newsletterSettings.buttonText.en,
            "zh-TW":
              res.data.newsletterSettings?.buttonText?.["zh-TW"] ||
              defaultSettings.newsletterSettings.buttonText["zh-TW"],
          },
          disclaimer: {
            en:
              res.data.newsletterSettings?.disclaimer?.en ||
              defaultSettings.newsletterSettings.disclaimer.en,
            "zh-TW":
              res.data.newsletterSettings?.disclaimer?.["zh-TW"] ||
              defaultSettings.newsletterSettings.disclaimer["zh-TW"],
          },
          discountPercentage: Number(
            res.data.newsletterSettings?.discountPercentage ??
              defaultSettings.newsletterSettings.discountPercentage
          ),
        },
        aboutPage: {
          ...defaultSettings.aboutPage,
          ...res.data.aboutPage,
          title: {
            en:
              res.data.aboutPage?.title?.en ||
              defaultSettings.aboutPage.title.en,
            "zh-TW":
              res.data.aboutPage?.title?.["zh-TW"] ||
              defaultSettings.aboutPage.title["zh-TW"],
          },
          subtitle: {
            en:
              res.data.aboutPage?.subtitle?.en ||
              defaultSettings.aboutPage.subtitle.en,
            "zh-TW":
              res.data.aboutPage?.subtitle?.["zh-TW"] ||
              defaultSettings.aboutPage.subtitle["zh-TW"],
          },
          story: {
            ...defaultSettings.aboutPage.story,
            ...res.data.aboutPage?.story,
            title: {
              en:
                res.data.aboutPage?.story?.title?.en ||
                defaultSettings.aboutPage.story.title.en,
              "zh-TW":
                res.data.aboutPage?.story?.title?.["zh-TW"] ||
                defaultSettings.aboutPage.story.title["zh-TW"],
            },
            content: {
              en:
                res.data.aboutPage?.story?.content?.en ||
                defaultSettings.aboutPage.story.content.en,
              "zh-TW":
                res.data.aboutPage?.story?.content?.["zh-TW"] ||
                defaultSettings.aboutPage.story.content["zh-TW"],
            },
          },
          team: {
            ...defaultSettings.aboutPage.team,
            ...res.data.aboutPage?.team,
            members: (res.data.aboutPage?.team?.members || []).map(
              (member: any) => ({
                name: {
                  en: member.name?.en || "",
                  "zh-TW": member.name?.["zh-TW"] || "",
                },
                role: {
                  en: member.role?.en || "",
                  "zh-TW": member.role?.["zh-TW"] || "",
                },
                image: member.image || "",
                description: {
                  en: member.description?.en || "",
                  "zh-TW": member.description?.["zh-TW"] || "",
                },
              })
            ),
          },
        },
        contactPage: {
          ...defaultSettings.contactPage,
          ...res.data.contactPage,
          title: {
            en:
              res.data.contactPage?.title?.en ||
              defaultSettings.contactPage.title.en,
            "zh-TW":
              res.data.contactPage?.title?.["zh-TW"] ||
              defaultSettings.contactPage.title["zh-TW"],
          },
          subtitle: {
            en:
              res.data.contactPage?.subtitle?.en ||
              defaultSettings.contactPage.subtitle.en,
            "zh-TW":
              res.data.contactPage?.subtitle?.["zh-TW"] ||
              defaultSettings.contactPage.subtitle["zh-TW"],
          },
          faq: {
            ...defaultSettings.contactPage.faq,
            ...res.data.contactPage?.faq,
            title: {
              en:
                res.data.contactPage?.faq?.title?.en ||
                defaultSettings.contactPage.faq.title.en,
              "zh-TW":
                res.data.contactPage?.faq?.title?.["zh-TW"] ||
                defaultSettings.contactPage.faq.title["zh-TW"],
            },
            questions: (res.data.contactPage?.faq?.questions || []).map(
              (q: any) => ({
                question: {
                  en: q.question?.en || "",
                  "zh-TW": q.question?.["zh-TW"] || "",
                },
                answer: {
                  en: q.answer?.en || "",
                  "zh-TW": q.answer?.["zh-TW"] || "",
                },
              })
            ),
          },
        },
      };

      console.log("Merged settings:", mergedSettings); // Debug log
      setSettings(mergedSettings);

      // Dispatch event after state is updated
      setTimeout(() => {
        window.dispatchEvent(new Event("settingsUpdated"));
        console.log("Settings updated event dispatched"); // Debug log
      }, 0);
    } catch (err) {
      console.error("Failed to fetch store settings:", err);
      setError("Failed to load store settings");
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch settings so navbar and other shared UI have data on all routes, including /admin
    fetchSettings();
  }, []);

  // Provide a wrapped version of settings that always ensures logo is valid
  const safeSettings = {
    ...settings,
    logo: settings.logo || defaultSettings.logo,
  };

  return (
    <StoreContext.Provider
      value={{
        settings: safeSettings,
        isLoading,
        error,
        refreshSettings: () => fetchSettings(true),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

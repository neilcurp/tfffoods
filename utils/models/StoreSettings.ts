import mongoose from "mongoose";

const multiLangSchema = {
  en: {
    type: String,
    default: "",
  },
  "zh-TW": {
    type: String,
    default: "",
  },
};

const privacyPolicySchema = {
  title: multiLangSchema,
  subtitle: multiLangSchema,
  sections: [
    {
      title: multiLangSchema,
      content: multiLangSchema,
      _id: false,
    },
  ],
  contactInfo: {
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: multiLangSchema,
  },
  lastUpdated: { type: Date, default: Date.now },
};

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: multiLangSchema,
    slogan: multiLangSchema,
    copyright: {
      en: {
        type: String,
        default: "© {{year}} {{storeName}}",
      },
      "zh-TW": {
        type: String,
        default: "© {{year}} {{storeName}}",
      },
    },
    logo: {
      type: String,
      default: "",
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        default: "",
      },
      phone: {
        type: String,
        required: true,
        default: "",
      },
    },
    businessHours: {
      weekdays: multiLangSchema,
      weekends: multiLangSchema,
    },
    socialMedia: {
      facebook: {
        type: String,
        default: "",
      },
      instagram: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
    },
    shippingInfo: {
      standardDays: {
        type: String,
        default: "",
      },
      expressDays: {
        type: String,
        default: "",
      },
      internationalShipping: {
        type: Boolean,
        default: false,
      },
      show: {
        type: Boolean,
        default: true,
      },
      title: multiLangSchema,
      standardShipping: multiLangSchema,
      expressShipping: multiLangSchema,
    },
    returnPolicy: {
      daysToReturn: {
        type: Number,
        default: 30,
      },
      conditions: multiLangSchema,
      show: {
        type: Boolean,
        default: true,
      },
      title: multiLangSchema,
    },
    newsletterSettings: {
      title: multiLangSchema,
      subtitle: multiLangSchema,
      bannerImage: {
        type: String,
        default: "",
      },
      discountPercentage: {
        type: Number,
        default: 0,
      },
      buttonText: multiLangSchema,
      disclaimer: multiLangSchema,
      backgroundColor: {
        type: String,
        default: "#f8f9fa",
      },
      textColor: {
        type: String,
        default: "#1a1a1a",
      },
    },
    aboutPage: {
      title: multiLangSchema,
      subtitle: multiLangSchema,
      bannerImage: {
        type: String,
        default: "",
      },
      story: {
        title: multiLangSchema,
        content: multiLangSchema,
        image: {
          type: String,
          default: "",
        },
      },
      values: {
        title: multiLangSchema,
        items: [
          {
            title: multiLangSchema,
            description: multiLangSchema,
            icon: {
              type: String,
            },
          },
        ],
      },
      team: {
        title: multiLangSchema,
        members: [
          {
            name: multiLangSchema,
            role: multiLangSchema,
            image: {
              type: String,
            },
            description: multiLangSchema,
          },
        ],
      },
    },
    contactPage: {
      title: multiLangSchema,
      subtitle: multiLangSchema,
      bannerImage: {
        type: String,
        default: "",
      },
      contactInfo: {
        title: multiLangSchema,
        officeLocations: [
          {
            name: multiLangSchema,
            address: multiLangSchema,
            phone: {
              type: String,
              default: "",
            },
            email: {
              type: String,
              default: "",
            },
            hours: multiLangSchema,
            coordinates: {
              lat: {
                type: Number,
                default: 0,
              },
              lng: {
                type: Number,
                default: 0,
              },
            },
          },
        ],
      },
      supportChannels: {
        title: multiLangSchema,
        image: {
          type: String,
          default: "",
        },
        channels: [
          {
            title: multiLangSchema,
            description: multiLangSchema,
            icon: {
              type: String,
            },
          },
        ],
      },
      faq: {
        title: multiLangSchema,
        questions: [
          {
            question: multiLangSchema,
            answer: multiLangSchema,
          },
        ],
      },
    },
    privacyPolicy: privacyPolicySchema,
    themeSettings: {
      light: {
        background: { type: String, default: "#ffffff" },
        card: { type: String, default: "#ffffff" },
        navbar: { type: String, default: "#ffffff" },
        text: { type: String, default: "#000000" },
        mutedText: { type: String, default: "#666666" },
        border: { type: String, default: "#e5e7eb" },
        footer: { type: String, default: "#f9fafb" },
        cardBorder: { type: String, default: "#e5e7eb" },
        cardItemBorder: { type: String, default: "#e5e7eb" },
        backgroundOpacity: { type: Number, default: 100 },
        cardOpacity: { type: Number, default: 100 },
        navbarOpacity: { type: Number, default: 100 },
        fontScale: { type: Number, default: 100 },
      },
      dark: {
        background: { type: String, default: "#1a1a1a" },
        card: { type: String, default: "#1e1e1e" },
        navbar: { type: String, default: "#1e1e1e" },
        text: { type: String, default: "#ffffff" },
        mutedText: { type: String, default: "#a1a1a1" },
        border: { type: String, default: "#374151" },
        footer: { type: String, default: "#111827" },
        cardBorder: { type: String, default: "#374151" },
        cardItemBorder: { type: String, default: "#374151" },
        backgroundOpacity: { type: Number, default: 100 },
        cardOpacity: { type: Number, default: 100 },
        navbarOpacity: { type: Number, default: 100 },
        fontScale: { type: Number, default: 100 },
      },
    },
  },
  {
    timestamps: true,
  }
);

const StoreSettings =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);

export default StoreSettings;

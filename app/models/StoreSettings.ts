import mongoose from "mongoose";

const StoreSettingsSchema = new mongoose.Schema({
  // ... existing code ...

  privacyPolicy: {
    title: {
      en: { type: String, default: "" },
      "zh-TW": { type: String, default: "" },
    },
    subtitle: {
      en: { type: String, default: "" },
      "zh-TW": { type: String, default: "" },
    },
    sections: [
      {
        title: {
          en: { type: String, default: "" },
          "zh-TW": { type: String, default: "" },
        },
        content: {
          en: { type: String, default: "" },
          "zh-TW": { type: String, default: "" },
        },
      },
    ],
    contactInfo: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: {
        en: { type: String, default: "" },
        "zh-TW": { type: String, default: "" },
      },
    },
    lastUpdated: { type: Date, default: Date.now },
  },

  // ... existing code ...
});

// ... existing code ... 
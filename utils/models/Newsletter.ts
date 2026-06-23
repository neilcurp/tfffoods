import mongoose from "mongoose";

export interface INewsletter extends mongoose.Document {
  email: string;
  source: string;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  lastEmailSentAt?: Date;
  preferences?: {
    marketing: boolean;
    updates: boolean;
    promotions: boolean;
  };
  resubscribe(): Promise<INewsletter>;
  unsubscribe(): Promise<INewsletter>;
}

interface NewsletterModel extends mongoose.Model<INewsletter> {
  findByEmail(email: string): Promise<INewsletter | null>;
}

const NewsletterSchema = new mongoose.Schema<INewsletter, NewsletterModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      default: "website",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unsubscribedAt: {
      type: Date,
      sparse: true,
    },
    lastEmailSentAt: {
      type: Date,
      sparse: true,
    },
    preferences: {
      marketing: {
        type: Boolean,
        default: true,
      },
      updates: {
        type: Boolean,
        default: true,
      },
      promotions: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

NewsletterSchema.index({ isActive: 1, subscribedAt: -1 });
NewsletterSchema.index({ email: 1, isActive: 1 });

NewsletterSchema.methods.unsubscribe = function () {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  this.markModified("isActive");
  this.markModified("unsubscribedAt");
  return this.save();
};

NewsletterSchema.methods.resubscribe = function () {
  this.isActive = true;
  this.unsubscribedAt = undefined;
  this.markModified("isActive");
  this.markModified("unsubscribedAt");
  return this.save();
};

NewsletterSchema.static("findByEmail", function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
});

NewsletterSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

const Newsletter =
  (mongoose.models.Newsletter as NewsletterModel) ||
  mongoose.model<INewsletter, NewsletterModel>("Newsletter", NewsletterSchema);

export default Newsletter;

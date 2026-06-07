import { StaticImageData } from "next/image";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";

export interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

export interface OfficeLocation {
  name: MultiLangValue;
  address: MultiLangValue;
  phone: string;
  email: string;
  hours: MultiLangValue;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface StoreSettings {
  storeName: MultiLangValue;
  logo: string | StaticImageData;
  contactInfo: ContactInfo;
  businessHours: {
    weekdays: MultiLangValue;
    weekends: MultiLangValue;
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
    show?: boolean;
    title?: MultiLangValue;
    standardShipping?: MultiLangValue;
    expressShipping?: MultiLangValue;
  };
  returnPolicy: {
    daysToReturn: number;
    conditions: MultiLangValue;
    show?: boolean;
    title?: MultiLangValue;
  };
  newsletterSettings: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    discountPercentage: number;
    buttonText: MultiLangValue;
    disclaimer: MultiLangValue;
  };
  aboutPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    story: {
      title: MultiLangValue;
      content: MultiLangValue;
      image: string;
    };
    values: {
      title: MultiLangValue;
      items: {
        title: MultiLangValue;
        description: MultiLangValue;
        icon: string;
      }[];
    };
    team: {
      title: MultiLangValue;
      members: {
        name: MultiLangValue;
        role: MultiLangValue;
        image: string;
        description: MultiLangValue;
      }[];
    };
  };
  contactPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    contactInfo: {
      title: MultiLangValue;
      officeLocations: ContactPageOfficeLocation[];
    };
    supportChannels: {
      title: MultiLangValue;
      image: string;
      channels: ContactPageChannel[];
    };
    faq: {
      title: MultiLangValue;
      questions: {
        question: MultiLangValue;
        answer: MultiLangValue;
      }[];
    };
  };
  slogan: MultiLangValue;
  copyright: MultiLangValue;
}

export interface AboutPageStory {
  title: MultiLangValue;
  content: MultiLangValue;
  image: string;
}

export interface AboutPageValue {
  title: MultiLangValue;
  description: MultiLangValue;
  icon: string;
}

export interface AboutPageTeamMember {
  name: MultiLangValue;
  role: MultiLangValue;
  image: string;
  description: MultiLangValue;
}

export interface AboutPageValues {
  title: MultiLangValue;
  items: AboutPageValue[];
}

export interface AboutPageTeam {
  title: MultiLangValue;
  members: AboutPageTeamMember[];
}

export interface AboutPage {
  title: MultiLangValue;
  subtitle: MultiLangValue;
  bannerImage: string;
  story: AboutPageStory;
  values: AboutPageValues;
  team: AboutPageTeam;
}

export interface ContactPageOfficeLocation {
  name: MultiLangValue;
  address: MultiLangValue;
  phone: string;
  email: string;
  hours: MultiLangValue;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactPageChannel {
  title: MultiLangValue;
  description: MultiLangValue;
  icon: string;
}

export interface ContactPageQuestion {
  question: MultiLangValue;
  answer: MultiLangValue;
}

export interface ContactPageInfo {
  title: MultiLangValue;
  officeLocations: ContactPageOfficeLocation[];
}

export interface ContactPageChannels {
  title: MultiLangValue;
  image: string;
  channels: ContactPageChannel[];
}

export interface ContactPageFAQ {
  title: MultiLangValue;
  questions: ContactPageQuestion[];
}

export interface ContactPage {
  title: MultiLangValue;
  subtitle: MultiLangValue;
  bannerImage: string;
  contactInfo: ContactPageInfo;
  supportChannels: ContactPageChannels;
  faq: ContactPageFAQ;
}

export type ArrayItem =
  | ContactPageOfficeLocation
  | ContactPageChannel
  | ContactPageQuestion
  | AboutPageTeamMember
  | AboutPageValue;

export type AboutPageSectionData =
  | AboutPageStory
  | AboutPageValues
  | AboutPageTeam;
export type ContactPageSectionData =
  | ContactPageInfo
  | ContactPageChannels
  | ContactPageFAQ;

export type SectionType = {
  aboutPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    story: AboutPageStory;
    values: AboutPageValues;
    team: AboutPageTeam;
  };
  contactPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    contactInfo: ContactPageInfo;
    supportChannels: ContactPageChannels;
    faq: ContactPageFAQ;
  };
};

export type SubsectionType = {
  [K in keyof SectionType]: keyof SectionType[K];
};

export type SectionKey = keyof SectionType;
export type SubsectionKey<T extends SectionKey> = keyof SectionType[T];

// Shared callback signatures threaded from the settings page into tab components.
export type SetSettings = Dispatch<SetStateAction<StoreSettings>>;

export type HandleInputChange = (
  value: MultiLangValue | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  section?: string
) => void;

export type UploadHandler = (result: CloudinaryUploadWidgetResults) => void;

export type TeamMemberUploadHandler = (
  result: CloudinaryUploadWidgetResults,
  index: number
) => void;

export type AddArrayItem = <T extends SectionKey>(
  section: T,
  subsection: SubsectionKey<T>,
  arrayName: string,
  newItem: ArrayItem
) => void;

export type RemoveArrayItem = <T extends SectionKey>(
  section: T,
  subsection: SubsectionKey<T>,
  arrayName: string,
  index: number
) => void;

export type CoordinateUpdate = (
  index: number,
  location: ContactPageOfficeLocation
) => Promise<void>;

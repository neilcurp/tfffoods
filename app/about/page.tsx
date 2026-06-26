"use client";

import React from "react";
import {
  Clock,
  Star,
  TrendingUp,
  Users,
  Shield,
  Award,
  CheckCircle,
  BadgeCheck,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useAboutPage } from "@/providers/about/AboutPageContext";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const AboutPage = () => {
  const { aboutSettings, isLoading, error } = useAboutPage();
  const { t, language } = useTranslation();

  const breadcrumbItems = [
    {
      label: t("navigation.about"),
      href: "/about",
      icon: Info,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!aboutSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">
          No about page data available
        </div>
      </div>
    );
  }

  const icons = {
    Clock,
    Star,
    TrendingUp,
    Users,
    Shield,
    Award,
    CheckCircle,
    BadgeCheck,
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      {/* Hero Section */}
      <header className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {aboutSettings.title[language]}
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            {aboutSettings.subtitle[language]}
          </p>
          <Image
            width={800}
            height={800}
            src={aboutSettings.bannerImage || "/images/banner-default.svg"}
            alt="About Banner"
            className="rounded-lg shadow-lg mx-auto"
          />
        </div>
      </header>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-foreground">
            {aboutSettings.story.title[language]}
          </h2>
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <Image
                width={500}
                height={500}
                src={aboutSettings.story.image || "/images/support-default.svg"}
                alt="Our Story"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="md:w-1/2 md:pl-8">
              <p className="text-lg mb-4 text-muted-foreground">
                {aboutSettings.story.content[language]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {aboutSettings.values.title[language]}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aboutSettings.values.items.map((value, index) => {
              const IconComponent = icons[value.icon as keyof typeof icons];
              return (
                <div
                  key={index}
                  className="bg-card p-6 rounded-lg shadow-lg text-center"
                >
                  {IconComponent && (
                    <IconComponent className="w-16 h-16 mx-auto mb-4 text-primary" />
                  )}
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {value.title[language]}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description[language]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            {aboutSettings.team.title[language]}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aboutSettings.team.members.map((member, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-lg shadow-lg text-center"
              >
                <Image
                  width={500}
                  height={500}
                  src={member.image || "/images/support-default.svg"}
                  alt={member.name[language]}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {member.name[language]}
                </h3>
                <p className="text-primary font-medium mb-2">
                  {member.role[language]}
                </p>
                <p className="text-muted-foreground">
                  {member.description[language]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

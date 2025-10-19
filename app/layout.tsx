import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import GoogleMapsScript from "@/components/GoogleMapsScript";
import { ThemeProvider } from "@/components/theme/theme-provider";

import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "react-hot-toast";
import { CloudinaryProvider } from "@/components/providers/CloudinaryProvider";
import { LanguageProvider } from "@/providers/language/LanguageContext";
import { CartUIProvider } from "@/components/ui/CartUIContext";
import { WishlistProvider } from "@/providers/WishlistProvider";

// Dynamically import components with loading fallbacks
const Navbar = dynamic(() => import("@/components/Navbar/Navbar"), {
  ssr: true,
  loading: () => (
    <div className="h-20 bg-white dark:bg-gray-900 shadow-md animate-pulse" />
  ),
});

const Footer = dynamic(() => import("@/components/Footer/Footer"), {
  ssr: true,
  loading: () => (
    <div className="h-40 bg-gradient-to-r from-gray-900 to-gray-800 animate-pulse" />
  ),
});

// Dynamically import providers with reduced loading impact
const StoreProvider = dynamic(
  () =>
    import("@/providers/store/StoreContext").then((mod) => mod.StoreProvider),
  { ssr: true }
);

const NewsletterProvider = dynamic(
  () =>
    import("@/providers/newsletter/NewsletterContext").then(
      (mod) => mod.NewsletterProvider
    ),
  { ssr: true }
);

const BlogProvider = dynamic(
  () => import("@/providers/blog/BlogContext").then((mod) => mod.BlogProvider),
  { ssr: true }
);

const HeroProvider = dynamic(
  () => import("@/providers/hero/HeroContext").then((mod) => mod.HeroProvider),
  { ssr: true }
);

const StoreSettingsProvider = dynamic(
  () =>
    import("@/providers/settings/StoreSettingsContext").then(
      (mod) => mod.StoreSettingsProvider
    ),
  { ssr: true }
);

const AboutPageProvider = dynamic(
  () =>
    import("@/providers/about/AboutPageContext").then(
      (mod) => mod.AboutPageProvider
    ),
  { ssr: true }
);

const ContactPageProvider = dynamic(
  () =>
    import("@/providers/contact/ContactPageContext").then(
      (mod) => mod.ContactPageProvider
    ),
  { ssr: true }
);

const CartProvider = dynamic(
  () => import("@/providers/cart/CartContext").then((mod) => mod.CartProvider),
  { ssr: true }
);

const UserProvider = dynamic(
  () => import("@/providers/user/UserContext").then((mod) => mod.UserProvider),
  { ssr: true }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "tummy foods",
  description: "Food creativity and healthly care for mother and child",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} app-background min-h-screen`}>
        <GoogleMapsScript />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense
            fallback={
              <div className="min-h-screen bg-background animate-pulse" />
            }
          >
            <AuthProvider>
              <CloudinaryProvider>
                <LanguageProvider key="language-provider">
                  <UserProvider>
                    <WishlistProvider>
                      <StoreProvider>
                        <BlogProvider>
                          <StoreSettingsProvider>
                            <NewsletterProvider>
                              <HeroProvider>
                                <AboutPageProvider>
                                  <ContactPageProvider>
                                    <CartProvider>
                                      <CartUIProvider>
                                        <div className="flex flex-col min-h-screen">
                                          <Navbar />
                                          <main className="flex-grow">
                                            {children}
                                          </main>
                                          <Footer />
                                        </div>
                                        <Toaster position="top-right" />
                                      </CartUIProvider>
                                    </CartProvider>
                                  </ContactPageProvider>
                                </AboutPageProvider>
                              </HeroProvider>
                            </NewsletterProvider>
                          </StoreSettingsProvider>
                        </BlogProvider>
                      </StoreProvider>
                    </WishlistProvider>
                  </UserProvider>
                </LanguageProvider>
              </CloudinaryProvider>
            </AuthProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { HexColorPicker } from "react-colorful";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Moon, Sun } from "lucide-react";

const FONT_SCALE_PRESETS = [
  { label: "Small", value: 90 },
  { label: "Normal", value: 100 },
  { label: "Large", value: 110 },
  { label: "X-Large", value: 125 },
];

export default function ThemeSettings() {
  const lightPickerRef = useRef<HTMLDivElement>(null);
  const darkPickerRef = useRef<HTMLDivElement>(null);
  const lightCardPickerRef = useRef<HTMLDivElement>(null);
  const darkCardPickerRef = useRef<HTMLDivElement>(null);
  const lightNavbarPickerRef = useRef<HTMLDivElement>(null);
  const darkNavbarPickerRef = useRef<HTMLDivElement>(null);
  const lightTextPickerRef = useRef<HTMLDivElement>(null);
  const darkTextPickerRef = useRef<HTMLDivElement>(null);
  const lightMutedTextPickerRef = useRef<HTMLDivElement>(null);
  const darkMutedTextPickerRef = useRef<HTMLDivElement>(null);
  const lightBorderPickerRef = useRef<HTMLDivElement>(null);
  const darkBorderPickerRef = useRef<HTMLDivElement>(null);
  const lightFooterPickerRef = useRef<HTMLDivElement>(null);
  const darkFooterPickerRef = useRef<HTMLDivElement>(null);
  const lightCardBorderPickerRef = useRef<HTMLDivElement>(null);
  const darkCardBorderPickerRef = useRef<HTMLDivElement>(null);
  const lightCardItemBorderPickerRef = useRef<HTMLDivElement>(null);
  const darkCardItemBorderPickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close color pickers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        lightPickerRef.current &&
        !lightPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightPicker(false);
      }
      if (
        darkPickerRef.current &&
        !darkPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkPicker(false);
      }
      if (
        lightCardPickerRef.current &&
        !lightCardPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightCardPicker(false);
      }
      if (
        darkCardPickerRef.current &&
        !darkCardPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkCardPicker(false);
      }
      if (
        lightNavbarPickerRef.current &&
        !lightNavbarPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightNavbarPicker(false);
      }
      if (
        darkNavbarPickerRef.current &&
        !darkNavbarPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkNavbarPicker(false);
      }
      if (
        lightTextPickerRef.current &&
        !lightTextPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightTextPicker(false);
      }
      if (
        darkTextPickerRef.current &&
        !darkTextPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkTextPicker(false);
      }
      if (
        lightMutedTextPickerRef.current &&
        !lightMutedTextPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightMutedTextPicker(false);
      }
      if (
        darkMutedTextPickerRef.current &&
        !darkMutedTextPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkMutedTextPicker(false);
      }
      if (
        lightBorderPickerRef.current &&
        !lightBorderPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightBorderPicker(false);
      }
      if (
        darkBorderPickerRef.current &&
        !darkBorderPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkBorderPicker(false);
      }
      if (
        lightFooterPickerRef.current &&
        !lightFooterPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightFooterPicker(false);
      }
      if (
        darkFooterPickerRef.current &&
        !darkFooterPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkFooterPicker(false);
      }
      if (
        lightCardBorderPickerRef.current &&
        !lightCardBorderPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightCardBorderPicker(false);
      }
      if (
        darkCardBorderPickerRef.current &&
        !darkCardBorderPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkCardBorderPicker(false);
      }
      if (
        lightCardItemBorderPickerRef.current &&
        !lightCardItemBorderPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightCardItemBorderPicker(false);
      }
      if (
        darkCardItemBorderPickerRef.current &&
        !darkCardItemBorderPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkCardItemBorderPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const { theme, setTheme } = useTheme();
  const [lightBgColor, setLightBgColor] = useState("#ffffff");
  const [darkBgColor, setDarkBgColor] = useState("#1a1a1a");
  const [lightCardColor, setLightCardColor] = useState("#ffffff");
  const [darkCardColor, setDarkCardColor] = useState("#1e1e1e");
  const [lightNavbarColor, setLightNavbarColor] = useState("#ffffff");
  const [darkNavbarColor, setDarkNavbarColor] = useState("#1e1e1e");
  const [lightTextColor, setLightTextColor] = useState("#000000");
  const [darkTextColor, setDarkTextColor] = useState("#ffffff");
  const [lightMutedTextColor, setLightMutedTextColor] = useState("#666666");
  const [darkMutedTextColor, setDarkMutedTextColor] = useState("#a1a1a1");
  const [lightBorderColor, setLightBorderColor] = useState("#e5e7eb");
  const [darkBorderColor, setDarkBorderColor] = useState("#374151");
  const [lightFooterColor, setLightFooterColor] = useState("#f9fafb");
  const [darkFooterColor, setDarkFooterColor] = useState("#111827");
  const [lightCardBorderColor, setLightCardBorderColor] = useState("#e5e7eb");
  const [darkCardBorderColor, setDarkCardBorderColor] = useState("#374151");
  const [lightCardItemBorderColor, setLightCardItemBorderColor] =
    useState("#e5e7eb");
  const [darkCardItemBorderColor, setDarkCardItemBorderColor] =
    useState("#374151");
  const [showLightPicker, setShowLightPicker] = useState(false);
  const [showDarkPicker, setShowDarkPicker] = useState(false);
  const [showLightCardPicker, setShowLightCardPicker] = useState(false);
  const [showDarkCardPicker, setShowDarkCardPicker] = useState(false);
  const [showLightNavbarPicker, setShowLightNavbarPicker] = useState(false);
  const [showDarkNavbarPicker, setShowDarkNavbarPicker] = useState(false);
  const [showLightTextPicker, setShowLightTextPicker] = useState(false);
  const [showDarkTextPicker, setShowDarkTextPicker] = useState(false);
  const [showLightMutedTextPicker, setShowLightMutedTextPicker] =
    useState(false);
  const [showDarkMutedTextPicker, setShowDarkMutedTextPicker] = useState(false);
  const [showLightBorderPicker, setShowLightBorderPicker] = useState(false);
  const [showDarkBorderPicker, setShowDarkBorderPicker] = useState(false);
  const [showLightFooterPicker, setShowLightFooterPicker] = useState(false);
  const [showDarkFooterPicker, setShowDarkFooterPicker] = useState(false);
  const [showLightCardBorderPicker, setShowLightCardBorderPicker] =
    useState(false);
  const [showDarkCardBorderPicker, setShowDarkCardBorderPicker] =
    useState(false);
  const [showLightCardItemBorderPicker, setShowLightCardItemBorderPicker] =
    useState(false);
  const [showDarkCardItemBorderPicker, setShowDarkCardItemBorderPicker] =
    useState(false);
  const [lightBgOpacity, setLightBgOpacity] = useState(100);
  const [darkBgOpacity, setDarkBgOpacity] = useState(100);
  const [lightCardOpacity, setLightCardOpacity] = useState(100);
  const [darkCardOpacity, setDarkCardOpacity] = useState(100);
  const [lightNavbarOpacity, setLightNavbarOpacity] = useState(100);
  const [darkNavbarOpacity, setDarkNavbarOpacity] = useState(100);
  const [lightFontScale, setLightFontScale] = useState(100);
  const [darkFontScale, setDarkFontScale] = useState(100);

  // Load saved colors on mount
  useEffect(() => {
    async function loadThemeSettings() {
      try {
        const response = await fetch("/api/theme-settings");
        const data = await response.json();

        if (data.themeSettings) {
          const { light, dark } = data.themeSettings;

          // Set light mode colors
          setLightBgColor(light.background);
          setLightCardColor(light.card);
          setLightNavbarColor(light.navbar);
          setLightTextColor(light.text);
          setLightMutedTextColor(light.mutedText);
          setLightBorderColor(light.border);
          setLightFooterColor(light.footer);
          setLightCardBorderColor(light.cardBorder);
          setLightCardItemBorderColor(light.cardItemBorder);
          setLightBgOpacity(light.backgroundOpacity);
          setLightCardOpacity(light.cardOpacity);
          setLightNavbarOpacity(light.navbarOpacity);
          setLightFontScale(light.fontScale ?? 100);

          // Set dark mode colors
          setDarkBgColor(dark.background);
          setDarkCardColor(dark.card);
          setDarkNavbarColor(dark.navbar);
          setDarkTextColor(dark.text);
          setDarkMutedTextColor(dark.mutedText);
          setDarkBorderColor(dark.border);
          setDarkFooterColor(dark.footer);
          setDarkCardBorderColor(dark.cardBorder);
          setDarkCardItemBorderColor(dark.cardItemBorder);
          setDarkBgOpacity(dark.backgroundOpacity);
          setDarkCardOpacity(dark.cardOpacity);
          setDarkNavbarOpacity(dark.navbarOpacity);
          setDarkFontScale(dark.fontScale ?? 100);
        }
      } catch (error) {
        console.error("Failed to load theme settings:", error);
        toast.error("Failed to load theme settings");
      }
    }

    loadThemeSettings();
  }, []);

  const handleSave = async () => {
    try {
      const themeSettings = {
        light: {
          background: lightBgColor,
          card: lightCardColor,
          navbar: lightNavbarColor,
          text: lightTextColor,
          mutedText: lightMutedTextColor,
          border: lightBorderColor,
          footer: lightFooterColor,
          cardBorder: lightCardBorderColor,
          cardItemBorder: lightCardItemBorderColor,
          backgroundOpacity: lightBgOpacity,
          cardOpacity: lightCardOpacity,
          navbarOpacity: lightNavbarOpacity,
          fontScale: lightFontScale,
        },
        dark: {
          background: darkBgColor,
          card: darkCardColor,
          navbar: darkNavbarColor,
          text: darkTextColor,
          mutedText: darkMutedTextColor,
          border: darkBorderColor,
          footer: darkFooterColor,
          cardBorder: darkCardBorderColor,
          cardItemBorder: darkCardItemBorderColor,
          backgroundOpacity: darkBgOpacity,
          cardOpacity: darkCardOpacity,
          navbarOpacity: darkNavbarOpacity,
          fontScale: darkFontScale,
        },
      };

      const response = await fetch("/api/theme-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ themeSettings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save theme settings");
      }

      toast.success("Theme settings saved");

      // Trigger a single theme update carrying the saved settings so the
      // provider applies them immediately (no refetch race, no flashing).
      window.dispatchEvent(
        new CustomEvent("themeUpdate", { detail: { themeSettings } })
      );
    } catch (error) {
      console.error("Failed to save theme settings:", error);
      toast.error("Failed to save theme settings");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Theme Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Light Mode Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Light Mode</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <Label>Font Size</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {FONT_SCALE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={
                      lightFontScale === preset.value ? "default" : "outline"
                    }
                    onClick={() => setLightFontScale(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="range"
                  min="75"
                  max="150"
                  step="5"
                  value={lightFontScale}
                  onChange={(e) => setLightFontScale(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right">{lightFontScale}%</span>
              </div>
              <p
                className="mt-2 truncate text-muted-foreground"
                style={{ fontSize: `${(16 * lightFontScale) / 100}px` }}
              >
                Sample text preview
              </p>
            </div>

            <div>
              <Label htmlFor="lightBgColor">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightBgColor }}
                  onClick={() => setShowLightPicker(!showLightPicker)}
                />
                <Input
                  id="lightBgColor"
                  value={lightBgColor}
                  onChange={(e) => setLightBgColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightPicker && (
                <div className="absolute mt-2 z-10" ref={lightPickerRef}>
                  <HexColorPicker
                    color={lightBgColor}
                    onChange={setLightBgColor}
                  />
                </div>
              )}
              <div className="mt-2">
                <Label htmlFor="lightBgOpacity">Background Transparency</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="lightBgOpacity"
                    min="0"
                    max="100"
                    value={lightBgOpacity}
                    onChange={(e) => setLightBgOpacity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{lightBgOpacity}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="lightCardColor">Card Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightCardColor }}
                  onClick={() => setShowLightCardPicker(!showLightCardPicker)}
                />
                <Input
                  id="lightCardColor"
                  value={lightCardColor}
                  onChange={(e) => setLightCardColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightCardPicker && (
                <div className="absolute mt-2 z-10" ref={lightCardPickerRef}>
                  <HexColorPicker
                    color={lightCardColor}
                    onChange={setLightCardColor}
                  />
                </div>
              )}
              <div className="mt-2">
                <Label htmlFor="lightCardOpacity">Card Transparency</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="lightCardOpacity"
                    min="0"
                    max="100"
                    value={lightCardOpacity}
                    onChange={(e) =>
                      setLightCardOpacity(Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{lightCardOpacity}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="lightNavbarColor">Navbar Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightNavbarColor }}
                  onClick={() =>
                    setShowLightNavbarPicker(!showLightNavbarPicker)
                  }
                />
                <Input
                  id="lightNavbarColor"
                  value={lightNavbarColor}
                  onChange={(e) => setLightNavbarColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightNavbarPicker && (
                <div className="absolute mt-2 z-10" ref={lightNavbarPickerRef}>
                  <HexColorPicker
                    color={lightNavbarColor}
                    onChange={setLightNavbarColor}
                  />
                </div>
              )}
              <div className="mt-2">
                <Label htmlFor="lightNavbarOpacity">Navbar Transparency</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="lightNavbarOpacity"
                    min="0"
                    max="100"
                    value={lightNavbarOpacity}
                    onChange={(e) =>
                      setLightNavbarOpacity(Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{lightNavbarOpacity}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="lightTextColor">Text Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightTextColor }}
                  onClick={() => setShowLightTextPicker(!showLightTextPicker)}
                />
                <Input
                  id="lightTextColor"
                  value={lightTextColor}
                  onChange={(e) => setLightTextColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightTextPicker && (
                <div className="absolute mt-2 z-10" ref={lightTextPickerRef}>
                  <HexColorPicker
                    color={lightTextColor}
                    onChange={setLightTextColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lightMutedTextColor">Muted Text Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightMutedTextColor }}
                  onClick={() =>
                    setShowLightMutedTextPicker(!showLightMutedTextPicker)
                  }
                />
                <Input
                  id="lightMutedTextColor"
                  value={lightMutedTextColor}
                  onChange={(e) => setLightMutedTextColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightMutedTextPicker && (
                <div
                  className="absolute mt-2 z-10"
                  ref={lightMutedTextPickerRef}
                >
                  <HexColorPicker
                    color={lightMutedTextColor}
                    onChange={setLightMutedTextColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lightBorderColor">Border Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightBorderColor }}
                  onClick={() =>
                    setShowLightBorderPicker(!showLightBorderPicker)
                  }
                />
                <Input
                  id="lightBorderColor"
                  value={lightBorderColor}
                  onChange={(e) => setLightBorderColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightBorderPicker && (
                <div className="absolute mt-2 z-10" ref={lightBorderPickerRef}>
                  <HexColorPicker
                    color={lightBorderColor}
                    onChange={setLightBorderColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lightFooterColor">Footer Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightFooterColor }}
                  onClick={() =>
                    setShowLightFooterPicker(!showLightFooterPicker)
                  }
                />
                <Input
                  id="lightFooterColor"
                  value={lightFooterColor}
                  onChange={(e) => setLightFooterColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightFooterPicker && (
                <div className="absolute mt-2 z-10" ref={lightFooterPickerRef}>
                  <HexColorPicker
                    color={lightFooterColor}
                    onChange={setLightFooterColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lightCardBorderColor">Card Border Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightCardBorderColor }}
                  onClick={() =>
                    setShowLightCardBorderPicker(!showLightCardBorderPicker)
                  }
                />
                <Input
                  id="lightCardBorderColor"
                  value={lightCardBorderColor}
                  onChange={(e) => setLightCardBorderColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightCardBorderPicker && (
                <div
                  className="absolute mt-2 z-10"
                  ref={lightCardBorderPickerRef}
                >
                  <HexColorPicker
                    color={lightCardBorderColor}
                    onChange={setLightCardBorderColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lightCardItemBorderColor">
                Card Item Border Color
              </Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightCardItemBorderColor }}
                  onClick={() =>
                    setShowLightCardItemBorderPicker(
                      !showLightCardItemBorderPicker
                    )
                  }
                />
                <Input
                  id="lightCardItemBorderColor"
                  value={lightCardItemBorderColor}
                  onChange={(e) => setLightCardItemBorderColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightCardItemBorderPicker && (
                <div
                  className="absolute mt-2 z-10"
                  ref={lightCardItemBorderPickerRef}
                >
                  <HexColorPicker
                    color={lightCardItemBorderColor}
                    onChange={setLightCardItemBorderColor}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Dark Mode Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Dark Mode</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <Label>Font Size</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {FONT_SCALE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={
                      darkFontScale === preset.value ? "default" : "outline"
                    }
                    onClick={() => setDarkFontScale(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="range"
                  min="75"
                  max="150"
                  step="5"
                  value={darkFontScale}
                  onChange={(e) => setDarkFontScale(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right">{darkFontScale}%</span>
              </div>
              <p
                className="mt-2 truncate text-muted-foreground"
                style={{ fontSize: `${(16 * darkFontScale) / 100}px` }}
              >
                Sample text preview
              </p>
            </div>

            <div>
              <Label htmlFor="darkBgColor">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkBgColor }}
                  onClick={() => setShowDarkPicker(!showDarkPicker)}
                />
                <Input
                  id="darkBgColor"
                  value={darkBgColor}
                  onChange={(e) => setDarkBgColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkPicker && (
                <div className="absolute mt-2 z-10" ref={darkPickerRef}>
                  <HexColorPicker
                    color={darkBgColor}
                    onChange={setDarkBgColor}
                  />
                </div>
              )}
              <div className="mt-2">
                <Label htmlFor="darkBgOpacity">Background Transparency</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="darkBgOpacity"
                    min="0"
                    max="100"
                    value={darkBgOpacity}
                    onChange={(e) => setDarkBgOpacity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{darkBgOpacity}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="darkCardColor">Card Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkCardColor }}
                  onClick={() => setShowDarkCardPicker(!showDarkCardPicker)}
                />
                <Input
                  id="darkCardColor"
                  value={darkCardColor}
                  onChange={(e) => setDarkCardColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkCardPicker && (
                <div className="absolute mt-2 z-10" ref={darkCardPickerRef}>
                  <HexColorPicker
                    color={darkCardColor}
                    onChange={setDarkCardColor}
                  />
                </div>
              )}
              <div className="mt-2">
                <Label htmlFor="darkCardOpacity">Card Transparency</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="darkCardOpacity"
                    min="0"
                    max="100"
                    value={darkCardOpacity}
                    onChange={(e) => setDarkCardOpacity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{darkCardOpacity}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="darkNavbarColor">Navbar Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkNavbarColor }}
                  onClick={() => setShowDarkNavbarPicker(!showDarkNavbarPicker)}
                />
                <Input
                  id="darkNavbarColor"
                  value={darkNavbarColor}
                  onChange={(e) => setDarkNavbarColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkNavbarPicker && (
                <div className="absolute mt-2 z-10" ref={darkNavbarPickerRef}>
                  <HexColorPicker
                    color={darkNavbarColor}
                    onChange={setDarkNavbarColor}
                  />
                </div>
              )}
              <div className="mt-2">
                <Label htmlFor="darkNavbarOpacity">Navbar Transparency</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="darkNavbarOpacity"
                    min="0"
                    max="100"
                    value={darkNavbarOpacity}
                    onChange={(e) =>
                      setDarkNavbarOpacity(Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{darkNavbarOpacity}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="darkTextColor">Text Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkTextColor }}
                  onClick={() => setShowDarkTextPicker(!showDarkTextPicker)}
                />
                <Input
                  id="darkTextColor"
                  value={darkTextColor}
                  onChange={(e) => setDarkTextColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkTextPicker && (
                <div className="absolute mt-2 z-10" ref={darkTextPickerRef}>
                  <HexColorPicker
                    color={darkTextColor}
                    onChange={setDarkTextColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="darkMutedTextColor">Muted Text Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkMutedTextColor }}
                  onClick={() =>
                    setShowDarkMutedTextPicker(!showDarkMutedTextPicker)
                  }
                />
                <Input
                  id="darkMutedTextColor"
                  value={darkMutedTextColor}
                  onChange={(e) => setDarkMutedTextColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkMutedTextPicker && (
                <div
                  className="absolute mt-2 z-10"
                  ref={darkMutedTextPickerRef}
                >
                  <HexColorPicker
                    color={darkMutedTextColor}
                    onChange={setDarkMutedTextColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="darkBorderColor">Border Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkBorderColor }}
                  onClick={() => setShowDarkBorderPicker(!showDarkBorderPicker)}
                />
                <Input
                  id="darkBorderColor"
                  value={darkBorderColor}
                  onChange={(e) => setDarkBorderColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkBorderPicker && (
                <div className="absolute mt-2 z-10" ref={darkBorderPickerRef}>
                  <HexColorPicker
                    color={darkBorderColor}
                    onChange={setDarkBorderColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="darkFooterColor">Footer Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkFooterColor }}
                  onClick={() => setShowDarkFooterPicker(!showDarkFooterPicker)}
                />
                <Input
                  id="darkFooterColor"
                  value={darkFooterColor}
                  onChange={(e) => setDarkFooterColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkFooterPicker && (
                <div className="absolute mt-2 z-10" ref={darkFooterPickerRef}>
                  <HexColorPicker
                    color={darkFooterColor}
                    onChange={setDarkFooterColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="darkCardBorderColor">Card Border Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkCardBorderColor }}
                  onClick={() =>
                    setShowDarkCardBorderPicker(!showDarkCardBorderPicker)
                  }
                />
                <Input
                  id="darkCardBorderColor"
                  value={darkCardBorderColor}
                  onChange={(e) => setDarkCardBorderColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkCardBorderPicker && (
                <div
                  className="absolute mt-2 z-10"
                  ref={darkCardBorderPickerRef}
                >
                  <HexColorPicker
                    color={darkCardBorderColor}
                    onChange={setDarkCardBorderColor}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="darkCardItemBorderColor">
                Card Item Border Color
              </Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkCardItemBorderColor }}
                  onClick={() =>
                    setShowDarkCardItemBorderPicker(
                      !showDarkCardItemBorderPicker
                    )
                  }
                />
                <Input
                  id="darkCardItemBorderColor"
                  value={darkCardItemBorderColor}
                  onChange={(e) => setDarkCardItemBorderColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkCardItemBorderPicker && (
                <div
                  className="absolute mt-2 z-10"
                  ref={darkCardItemBorderPickerRef}
                >
                  <HexColorPicker
                    color={darkCardItemBorderColor}
                    onChange={setDarkCardItemBorderColor}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Button onClick={handleSave} className="mt-6">
        Save Changes
      </Button>
    </div>
  );
}

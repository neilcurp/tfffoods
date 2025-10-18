import React from "react";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import Link from "next/link";

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productModile?: boolean;
  setProductModile?: (value: boolean) => void;
}

const ProductDrawer = ({
  isOpen,
  onClose,
  productModile,
  setProductModile,
}: ProductDrawerProps) => {
  const handleClose = () => {
    // Only for Back to Menu button
    if (productModile) {
      setProductModile?.(false);
      return;
    }
    onClose();
  };

  const handleLinkClick = () => {
    // For links, always use setProductModile in mobile
    if (productModile && setProductModile) {
      setProductModile(false);
    } else {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 transition-all duration-300 z-50 ${
        isOpen
          ? "opacity-100 visible"
          : "opacity-0 invisible pointer-events-none"
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[400px] bg-background border-b border-border shadow-lg transition-all duration-300 transform ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <IoMdClose className="h-5 w-5" /> Back to Menu
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-2 overflow-y-auto max-h-[calc(400px-4rem)]">
          {[
            "Rolex",
            "Patek Philippe",
            "Audemars Piguet",
            "Richard Mille",
            "Omega",
            "IWC",
            "Cartier",
            "Tudor",
          ].map((brand) => (
            <div key={brand}>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {brand}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`/products/brand/${brand
                      .toLowerCase()
                      .replace(" ", "")}`}
                    prefetch={false}
                    onClick={handleLinkClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View All {brand}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/products/brand/${brand
                      .toLowerCase()
                      .replace(" ", "")}?sort=new`}
                    prefetch={false}
                    onClick={handleLinkClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/products/brand/${brand
                      .toLowerCase()
                      .replace(" ", "")}?sort=popular`}
                    prefetch={false}
                    onClick={handleLinkClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Popular
                  </Link>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDrawer;

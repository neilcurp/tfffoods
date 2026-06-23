import { AppProps } from "next/app";
import { CartUIProvider } from "@/components/ui/CartUIContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartUIProvider>
      <Component {...pageProps} />
    </CartUIProvider>
  );
}

export default MyApp;

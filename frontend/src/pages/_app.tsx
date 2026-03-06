import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App({ Component, pageProps }: any) {
  return (
    <TooltipProvider>
      <Navbar />
      <Component {...pageProps} />
      <Toaster />
    </TooltipProvider>
  );
}

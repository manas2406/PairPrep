import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App({ Component, pageProps }) {
  return (
    <TooltipProvider>
      <Navbar />
      <Component {...pageProps} />
      <SonnerToaster />
      <Toaster />
    </TooltipProvider>
  );
}

import Error404 from "@/components/ui/404Error";
import Copyright from "@/components/ui/Copyright";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClientProviders from "@/components/providers/ClientProviders";

export default function NotFound() {
  return (
    <ClientProviders>
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Error404 />
        </div>
        <Footer />
        <Copyright />
      </div>
    </ClientProviders>
  );
}

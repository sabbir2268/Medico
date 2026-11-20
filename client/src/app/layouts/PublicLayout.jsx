import { Outlet } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ToolGrid from "@/components/ToolGrid";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ToolGrid />
        <Features />
      </main>
      <Footer />
    </>
  );
}

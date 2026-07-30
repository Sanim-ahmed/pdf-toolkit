import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for PDF Toolkit. Please read these terms before using our service.",
};

const sections = [
  {
    title: "Acceptable Use",
    content:
      "You agree to use PDF Toolkit only for lawful purposes and in accordance with these terms. You must not use the service for any illegal or unauthorized purpose. You must not attempt to disrupt the service or circumvent any security measures.",
  },
  {
    title: "Service Availability",
    content:
      "We strive to provide uninterrupted service, but we do not guarantee that the service will be available at all times. We reserve the right to modify, suspend, or discontinue the service at any time without notice.",
  },
  {
    title: "User Responsibility",
    content:
      "You are solely responsible for the files you upload and process through our service. You must ensure that you have the legal right to process any files you upload. We are not responsible for any loss or damage resulting from your use of the service.",
  },
  {
    title: "Intellectual Property",
    content:
      "PDF Toolkit and its original content, features, and functionality are owned by the developer and are protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without explicit permission.",
  },
  {
    title: "Limitation of Liability",
    content:
      "PDF Toolkit shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the service. This includes but is not limited to data loss, processing errors, or service interruptions.",
  },
  {
    title: "Disclaimer",
    content:
      "The service is provided 'as is' without any warranty, express or implied. We do not guarantee that the service will meet your requirements or that it will be error-free. Use of the service is at your own risk.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/[0.06] blur-[120px]" />

          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                Terms of
                <br />
                <span className="gradient-text">Service</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-slate-400">
                Please read these terms carefully before using PDF Toolkit.
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="glass-card rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for PDF Toolkit. Learn how we handle your files and data.",
};

const policies = [
  {
    title: "Temporary Processing",
    desc: "Files are processed temporarily on our servers and are automatically deleted after processing completes.",
  },
  {
    title: "Automatic Deletion",
    desc: "All uploaded and generated files are automatically and permanently deleted from our servers after processing.",
  },
  {
    title: "No Permanent Storage",
    desc: "Files are never stored permanently. We do not retain any copies of your documents.",
  },
  {
    title: "No Sharing",
    desc: "Your documents are never shared with third parties. All processing is done securely.",
  },
  {
    title: "No Data Selling",
    desc: "We do not sell any personal data. Your privacy is our priority.",
  },
  {
    title: "User Privacy Focus",
    desc: "Our entire service is designed with user privacy as a core principle. We only process what is necessary.",
  },
];

export default function PrivacyPage() {
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
                Privacy
                <br />
                <span className="gradient-text">Policy</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-slate-400">
                Your privacy matters. Here is how we handle your data.
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {policies.map((policy) => (
                <div key={policy.title} className="glass-card rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white">
                    {policy.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {policy.desc}
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

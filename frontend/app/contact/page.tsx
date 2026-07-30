"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/[0.06] blur-[120px]" />

          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                Get in
                <br />
                <span className="gradient-text">Touch</span>
              </h1>
            </div>

            <div className="mt-12 space-y-8">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white">Contact Information</h2>
                <div className="mt-4 space-y-3">
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">Name:</span>{" "}
                    Sanim Ahmed Khan
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">Email:</span>{" "}
                    <a
                      href="mailto:sanimahmedofficial@gmail.com"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      sanimahmedofficial@gmail.com
                    </a>
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">Phone:</span>{" "}
                    +8801308518919
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">GitHub:</span>{" "}
                    <a
                      href="https://github.com/Sanim-ahmed"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      https://github.com/Sanim-ahmed
                    </a>
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">LinkedIn:</span>{" "}
                    <a
                      href="https://www.linkedin.com/in/sanimahmedkhan/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      https://www.linkedin.com/in/sanimahmedkhan/
                    </a>
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white">Send a Message</h2>
                {submitted ? (
                  <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-center">
                    <p className="text-emerald-400">
                      &#10003; Thank you for your message!
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      I will get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/50 focus:bg-indigo-500/[0.04] focus:ring-1 focus:ring-indigo-500/20"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/50 focus:bg-indigo-500/[0.04] focus:ring-1 focus:ring-indigo-500/20"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="message"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/50 focus:bg-indigo-500/[0.04] focus:ring-1 focus:ring-indigo-500/20"
                        placeholder="Your message"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>

              <div className="glass-card rounded-2xl p-8">
                <p className="text-sm text-slate-400 leading-relaxed">
                  Thank you for visiting PDF Toolkit! If you have any questions,
                  suggestions, feature requests, bug reports, or collaboration
                  opportunities, feel free to contact me using the information
                  above or the contact form.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

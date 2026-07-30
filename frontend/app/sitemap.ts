import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pdf-toolkit-zeta-nine.vercel.app";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/merge-pdf`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/split-pdf`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/compress-pdf`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pdf-to-word`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/word-to-pdf`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pdf-to-text`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/text-to-pdf`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/image-to-pdf`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pdf-to-image`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/ocr`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  ];
}

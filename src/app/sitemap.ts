import type { MetadataRoute } from "next";

const siteUrl = "https://finzyapp.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/contatti`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}

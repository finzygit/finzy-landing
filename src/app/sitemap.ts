import type { MetadataRoute } from "next";
import { ACCOUNT_DELETION_PATH } from "@/lib/account-deletion";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/contatti`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}${ACCOUNT_DELETION_PATH}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

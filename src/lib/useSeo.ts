import { useEffect } from "react";

type SeoOptions = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeo({ title, description, ogTitle, ogDescription, ogImage, noindex }: SeoOptions) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) upsertMeta("name", "description", description);
    if (ogTitle ?? title) upsertMeta("property", "og:title", ogTitle ?? title!);
    if (ogDescription ?? description) upsertMeta("property", "og:description", ogDescription ?? description!);
    if (ogImage) {
      upsertMeta("property", "og:image", ogImage);
      upsertMeta("name", "twitter:image", ogImage);
    }
    if (noindex) upsertMeta("name", "robots", "noindex,nofollow");
  }, [title, description, ogTitle, ogDescription, ogImage, noindex]);
}

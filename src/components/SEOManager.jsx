import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://revelacode.co.ke";
const PRIVATE_PREFIXES = [
  "/pages", "/admin", "/support", "/jumuiya", "/meta-engineer",
  "/sci-core", "/bible", "/elimu-invitation"
];

function setMeta(name, content, attribute = "name") {
  let node = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setCanonical(url) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }
  node.setAttribute("href", url);
}

function titleCase(value) {
  return String(value || "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SEOManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\\/+$/, "") || "/";
    const parts = path.split("/").filter(Boolean);
    const first = parts[0] || "";
    const isPrivate = PRIVATE_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    );
    const isPlatformRoute = [
      "pages", "admin", "support", "jumuiya", "meta-engineer",
      "sci-core", "bible", "elimu-invitation"
    ].includes(first);

    let title = "RevelaCode | Software Development, AI & Digital Innovation";
    let description = "RevelaCode Software Solutions develops software, AI-powered technology and digital platforms for education, agriculture, business and communities.";
    let shouldIndex = !isPrivate;

    if (path === "/") {
      title = "RevelaCode | Software Development, AI & Digital Innovation";
    } else if (first === "b" && parts[1]) {
      const business = titleCase(parts[1]);
      title = `${business} | Business Website on RevelaCode`;
      description = `Explore ${business}, a public business website powered by RevelaCode Biashara. Discover its products, services and business information.`;
    } else if (!isPlatformRoute && first) {
      const school = titleCase(first);
      const section = parts.length > 1 ? titleCase(parts.slice(1).join(" ")) : "Home";
      title = section === "Home"
        ? `${school} | School Website on Elimu by Jumuiya OS`
        : `${section} | ${school} — Elimu by Jumuiya OS`;
      description = `Visit ${school}'s public school website on Elimu by Jumuiya OS. Explore school information, academics, activities, events and community updates.`;
    } else if (path === "/elimu-invitation") {
      shouldIndex = false;
      title = "School Invitation | RevelaCode Elimu";
    } else {
      shouldIndex = false;
    }

    document.title = title;
    setMeta("description", description);
    setMeta("robots", shouldIndex
      ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      : "noindex, nofollow");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", SITE + path, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "RevelaCode", "property");
    setCanonical(SITE + path + location.search);
  }, [location.pathname, location.search]);

  return null;
}

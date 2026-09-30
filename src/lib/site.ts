import config from '../../site.config.json';

export interface NavItem {
  label: string;
  href: string;
}

export interface SiteConfig {
  title: string;
  tagline: string;
  description: string;
  url: string;
  author: { name: string; email: string; twitter: string };
  locale: string;
  postsPerPage: number;
  nav: NavItem[];
  social: NavItem[];
}

export const site = config as SiteConfig;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(pathname: string): string {
  return new URL(pathname, site.url).toString().replace(/\/$/, '') || site.url;
}

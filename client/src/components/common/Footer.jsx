import { siteConfig } from "@/config/site";

function Footer() {
  return (
    <footer className="border-t border-line bg-surface py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted sm:flex-row sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <p>{siteConfig.tagline}</p>
      </div>
    </footer>
  );
}

export default Footer;

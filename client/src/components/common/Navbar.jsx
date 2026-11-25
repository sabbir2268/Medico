import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ClipboardList,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CART_CHANGE_EVENT, getCartCount } from "@/features/shop/utils/cart";
import { useCart } from "@/features/cart/hooks/useCart";
import { PATHS } from "@/utils/paths";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
];

function navLinkClass({ isActive }) {
  return cn(
    "rounded-control px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-hover",
  );
}

function DropdownPanel({ children, className }) {
  return (
    <div
      className={cn(
        "absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border border-line bg-surface p-1.5 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

function MenuItem({ icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-hover"
    >
      {Icon && <Icon className="h-4 w-4 text-muted" aria-hidden="true" />}
      {children}
    </button>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const [language, setLanguage] = useState("en");
  const { cart: backendCart, isGuest } = useCart();

  const languageRef = useRef(null);
  const accountRef = useRef(null);
  const cartRef = useRef(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    function handleCartChange(event) {
      setCartCount(event.detail?.count ?? getCartCount());
    }

    window.addEventListener(CART_CHANGE_EVENT, handleCartChange);

    return () => window.removeEventListener(CART_CHANGE_EVENT, handleCartChange);
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!languageRef.current?.contains(event.target)) setLanguageOpen(false);
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      if (!cartRef.current?.contains(event.target)) setCartOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectLanguage(code) {
    setLanguage(code);
    setLanguageOpen(false);
    setMobileOpen(false);
  }

  const displayCartCount = isGuest ? cartCount : backendCart.itemCount;
  const cartItems = isGuest ? [] : backendCart.items;

  const initials = (user?.name ?? user?.email ?? "GU")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          to={PATHS.HOME}
          className="flex shrink-0 items-center gap-2 font-heading text-lg font-bold text-primary"
          aria-label={`${siteConfig.name} home`}
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M10.5 4.5a3 3 0 0 1 4.24 0l4.76 4.76a3 3 0 0 1 0 4.24l-4.76 4.76a3 3 0 0 1-4.24 0L5.74 13.5a3 3 0 0 1 0-4.24L10.5 4.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path d="M7.5 16.5 16.5 7.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          {siteConfig.name}
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to={PATHS.HOME} className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to={PATHS.SHOP} className={navLinkClass}>
            Shop
          </NavLink>
          <NavLink to={PATHS.DEALS} className={navLinkClass}>
            Deals
          </NavLink>
          <NavLink to={PATHS.CATEGORIES} className={navLinkClass}>
            Categories
          </NavLink>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative hidden sm:block" ref={languageRef}>
            <button
              type="button"
              onClick={() => setLanguageOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded-control px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-hover"
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              aria-label="Select language"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            </button>
            {languageOpen && (
              <DropdownPanel role="menu">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    role="menuitem"
                    onClick={() => selectLanguage(item.code)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-control px-3 py-2 text-left text-sm transition hover:bg-hover",
                      item.code === language
                        ? "font-semibold text-primary"
                        : "text-foreground",
                    )}
                  >
                    {item.label}
                    <span className="text-xs text-muted uppercase">{item.code}</span>
                  </button>
                ))}
              </DropdownPanel>
            )}
          </div>

          {isAuthenticated && (
          <div className="relative" ref={cartRef}>
            <button
              type="button"
              onClick={() => setCartOpen((open) => !open)}
              className="relative flex h-10 w-10 items-center justify-center rounded-control text-foreground transition hover:bg-hover"
              aria-label="Open cart"
              aria-haspopup="dialog"
              aria-expanded={cartOpen}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {displayCartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {displayCartCount}
                </span>
              )}
            </button>
            {cartOpen && (
              <DropdownPanel
                className="w-72 p-4"
                role="dialog"
                aria-label="Shopping cart"
              >
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Your cart
                </h3>
                {cartItems.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {cartItems.slice(0, 3).map((item) => (
                      <div
                        key={item.medicineId}
                        className="flex items-center justify-between gap-2 rounded-control bg-hover px-2.5 py-2 text-xs"
                      >
                        <span className="min-w-0 truncate font-medium text-foreground">
                          {item.medicine?.name ?? "Medicine"}
                        </span>
                        <span className="shrink-0 text-muted">×{item.quantity}</span>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setCartOpen(false);
                        navigate(PATHS.CART);
                      }}
                    >
                      View cart · {displayCartCount} items
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center rounded-control border border-dashed border-line px-3 py-6 text-center">
                    <ShoppingCart className="h-6 w-6 text-muted" aria-hidden="true" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Your cart is empty
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Add medicines from verified vendors to get started.
                    </p>
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setCartOpen(false);
                        navigate(PATHS.SHOP);
                      }}
                    >
                      Browse medicines
                    </Button>
                  </div>
                )}
              </DropdownPanel>
            )}
          </div>
          )}

          <div className="relative hidden sm:block" ref={accountRef}>
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-control py-1 pr-2 pl-1 transition hover:bg-hover"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-label="Open profile menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {initials}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                </button>
                {accountOpen && (
                  <DropdownPanel role="menu">
                    <div className="border-b border-line px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {user.name ?? "My account"}
                      </p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <div className="pt-1.5">
                      <MenuItem icon={UserRound} onClick={() => navigate(PATHS.PROFILE)}>
                        Profile
                      </MenuItem>
                      <MenuItem
                        icon={ClipboardList}
                        onClick={() => navigate(PATHS.ORDERS)}
                      >
                        My orders
                      </MenuItem>
                      <MenuItem
                        icon={LayoutDashboard}
                        onClick={() => navigate(PATHS.DASHBOARD)}
                      >
                        Dashboard
                      </MenuItem>
                      <MenuItem
                        icon={LogOut}
                        onClick={async () => {
                          await logout();
                          setAccountOpen(false);
                          navigate(PATHS.HOME, { replace: true });
                        }}
                      >
                        Log out
                      </MenuItem>
                    </div>
                  </DropdownPanel>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <Button size="sm" onClick={() => navigate(PATHS.LOGIN)}>
                    Sign in
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    className="flex h-9 w-7 items-center justify-center rounded-r-control text-muted transition hover:bg-hover"
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    aria-label="More account options"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                {accountOpen && (
                  <DropdownPanel role="menu">
                    <MenuItem icon={UserRound} onClick={() => navigate(PATHS.LOGIN)}>
                      Log in
                    </MenuItem>
                    <MenuItem icon={UserRound} onClick={() => navigate(PATHS.REGISTER)}>
                      Create account
                    </MenuItem>
                    <MenuItem
                      icon={ClipboardList}
                      onClick={() => navigate(PATHS.REGISTER)}
                    >
                      Become a vendor
                    </MenuItem>
                  </DropdownPanel>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-control text-foreground transition hover:bg-hover md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-line bg-surface px-4 pt-2 pb-4 sm:px-6 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink
              to={PATHS.HOME}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
              end
            >
              Home
            </NavLink>
            <NavLink
              to={PATHS.SHOP}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Shop
            </NavLink>
            <NavLink
              to={PATHS.DEALS}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Deals
            </NavLink>
            <NavLink
              to={PATHS.CATEGORIES}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Categories
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to={PATHS.CART}
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Cart ({displayCartCount})
              </NavLink>
            )}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Language
            </p>
            <div className="flex flex-wrap gap-2 px-3">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => selectLanguage(item.code)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    item.code === language
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-line text-foreground hover:bg-hover",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2 border-t border-line pt-4 sm:hidden">
            {isAuthenticated ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate(PATHS.PROFILE)}
              >
                My account
              </Button>
            ) : (
              <>
                <Button className="flex-1" onClick={() => navigate(PATHS.LOGIN)}>
                  Sign in
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => navigate(PATHS.REGISTER)}
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

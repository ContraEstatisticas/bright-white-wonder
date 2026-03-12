import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoEducy from "@/assets/logo-educy.png";

export const LandingNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("landing.nav.home"), href: "/#inicio" },
    { name: t("landing.nav.about"), href: "/#sobre" },
    { name: t("landing.nav.testimonials"), href: "/#depoimentos" },
    { name: t("landing.nav.plan"), href: "/#plano" },
    { name: t("landing.nav.contact"), href: "/contato", isRoute: true },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1002] ld-ease ${
        isScrolled ? "ld-glass border-b border-white/10 shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 relative z-10">
            <img src={logoEducy} alt="Educy" className="h-12 md:h-14 brightness-0 invert" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link key={link.href} to={link.href} className="text-white/70 hover:text-white ld-ease font-medium text-sm ld-link">
                  {link.name}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="text-white/70 hover:text-white ld-ease font-medium text-sm ld-link">
                  {link.name}
                </a>
              ),
            )}
            <Link to="/auth">
              <button className="ld-btn-pill bg-[hsl(25,90%,55%)] text-white hover:shadow-lg">
                {t("landing.nav.login", "Login")}
              </button>
            </Link>
          </div>

          {/* Mobile */}
          <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link key={link.href} to={link.href} className="text-white/70 hover:text-white ld-ease font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                    {link.name}
                  </Link>
                ) : (
                  <a key={link.href} href={link.href} className="text-white/70 hover:text-white ld-ease font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                    {link.name}
                  </a>
                ),
              )}
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <button className="ld-btn-pill bg-[hsl(25,90%,55%)] text-white w-full">
                  {t("landing.nav.login", "Login")}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

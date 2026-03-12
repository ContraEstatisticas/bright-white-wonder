import { Link } from "react-router-dom";
import { Instagram, Linkedin, Youtube, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoEducy from "@/assets/logo-educy.png";

const socialLinks = [
  {
    icon: Instagram,
    href: "#",
    label: "Instagram",
  },
  {
    icon: Linkedin,
    href: "#",
    label: "LinkedIn",
  },
  {
    icon: Youtube,
    href: "#",
    label: "YouTube",
  },
  {
    icon: Twitter,
    href: "#",
    label: "Twitter",
  },
];

export const Footer = () => {
  const { t } = useTranslation();
  const footerLinks = {
    programas: [
      { name: t("landing.footer.links.aiFundamentals"), href: "#" },
      { name: t("landing.footer.links.machineLearning"), href: "#" },
      { name: t("landing.footer.links.deepLearning"), href: "#" },
      { name: t("landing.footer.links.aiForBusiness"), href: "#" },
    ],
    recursos: [
      { name: t("landing.footer.links.blog"), href: "#" },
      { name: t("landing.footer.links.webinars"), href: "#" },
      { name: t("landing.footer.links.ebooks"), href: "#" },
      { name: t("landing.footer.links.community"), href: "#" },
    ],
    empresa: [
      { name: t("landing.footer.links.aboutUs"), href: "#" },
      { name: t("landing.footer.links.careers"), href: "#" },
      { name: t("landing.footer.links.partnerships"), href: "#" },
      { name: t("landing.footer.links.contact"), href: "/contato", isRoute: true },
    ],
    legal: [
      { name: t("landing.footer.links.terms"), href: "/termos", isRoute: true },
      { name: t("landing.footer.links.privacy"), href: "/privacidade", isRoute: true },
      { name: t("landing.footer.links.cookies"), href: "/cookies", isRoute: true },
      { name: t("landing.footer.links.refund"), href: "/cancelamento", isRoute: true },
      { name: t("landing.footer.links.subscriptionTerms"), href: "/termos-assinatura", isRoute: true },
    ],
  };

  const linkStyle = {
    transition: 'color 0.3s cubic-bezier(.165,.84,.44,1)',
  };

  return (
    <footer
      id="contato"
      className="text-secondary-foreground"
      style={{ background: 'linear-gradient(180deg, #101722 0%, #0a0f1a 100%)', paddingTop: '5rem', paddingBottom: '3rem' }}
    >
      <div className="container mx-auto px-4 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 mb-16">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <img src={logoEducy} alt="Educy" className="h-8" />
            </Link>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">
              {t("landing.footer.description")}
            </p>
            <p className="text-white/50 text-sm">
              <span className="font-medium text-white/70">{t("landing.footer.contact")}:</span>{" "}
              <a
                href="mailto:contact@educly.app"
                className="hover:text-white/90 transition-colors"
                style={linkStyle}
              >
                contact@educly.app
              </a>
            </p>

            {/* Social links */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    ...linkStyle,
                  }}
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links — Programs */}
          <div>
            <h4 className="font-semibold text-white/90 mb-5 text-sm uppercase tracking-wider">
              {t("landing.footer.programs")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.programas.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/90 transition-colors"
                    style={linkStyle}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links — Resources */}
          <div>
            <h4 className="font-semibold text-white/90 mb-5 text-sm uppercase tracking-wider">
              {t("landing.footer.resources")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.recursos.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/90 transition-colors"
                    style={linkStyle}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links — Company */}
          <div>
            <h4 className="font-semibold text-white/90 mb-5 text-sm uppercase tracking-wider">
              {t("landing.footer.company")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-white/50 hover:text-white/90 transition-colors"
                      style={linkStyle}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white/90 transition-colors"
                      style={linkStyle}
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Links — Legal */}
          <div>
            <h4 className="font-semibold text-white/90 mb-5 text-sm uppercase tracking-wider">
              {t("landing.footer.legal")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-white/50 hover:text-white/90 transition-colors"
                      style={linkStyle}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white/90 transition-colors"
                      style={linkStyle}
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Subtle separator */}
        <div
          className="mb-10"
          style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
        />

        {/* Bottom Bar */}
        <div className="space-y-8">
          <div className="text-center space-y-5">
            <p className="text-sm text-white/70 font-medium">
              {t("company.ownershipStatement")}
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-xs text-white/40">
              {/* Empresa 1: Contra Estatistica */}
              <div className="max-w-xs text-center md:text-left">
                <p className="font-bold text-white/60 mb-1">
                  Contra Estatistica Digital Marketers LLC
                </p>
                <p>
                  1209 Mountain Road Pl NE, Ste R, Albuquerque, NM 87110, United States
                  <br />
                  EIN: 39-4917931
                </p>
              </div>

              {/* Divisor Visual */}
              <div
                className="hidden md:block w-px h-10"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />
              <div
                className="block md:hidden w-16 h-px"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />

              {/* Empresa 2: SELLCORE */}
              <div className="max-w-xs text-center md:text-left">
                <p className="font-bold text-white/60 mb-1">
                  SELLCORE LTD.
                </p>
                <p>
                  {t("company.registration")}: C 62598 • Saint Kitts and Nevis
                  <br />
                  Suites 5 Horsford's Business Centre, Long Point Road, Charlestown, Nevis
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/30 text-center">
            © {new Date().getFullYear()} Educly. {t("landing.footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

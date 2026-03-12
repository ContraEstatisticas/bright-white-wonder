import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoEducy from "@/assets/logo-educy.png";

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

  const renderLink = (link: { name: string; href: string; isRoute?: boolean }) =>
    link.isRoute ? (
      <Link to={link.href} className="text-sm text-white/40 hover:text-[hsl(25,90%,55%)] ld-ease ld-link">
        {link.name}
      </Link>
    ) : (
      <a href={link.href} className="text-sm text-white/40 hover:text-[hsl(25,90%,55%)] ld-ease ld-link">
        {link.name}
      </a>
    );

  return (
    <footer id="contato" className="ld-navy pt-20 pb-10 border-t border-white/5">
      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-5">
              <img src={logoEducy} alt="Educy" className="h-8 brightness-0 invert" />
            </Link>
            <p className="text-white/40 text-sm mb-4 leading-relaxed">{t("landing.footer.description")}</p>
            <p className="text-white/40 text-sm">
              <span className="font-medium text-white/60">{t("landing.footer.contact")}:</span>{" "}
              <a href="mailto:contact@educly.app" className="hover:text-[hsl(25,90%,55%)] ld-ease">
                contact@educly.app
              </a>
            </p>
          </div>

          {[
            { title: t("landing.footer.programs"), links: footerLinks.programas },
            { title: t("landing.footer.resources"), links: footerLinks.recursos },
            { title: t("landing.footer.company"), links: footerLinks.empresa },
            { title: t("landing.footer.legal"), links: footerLinks.legal },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-white/80 mb-4 text-sm uppercase tracking-wider">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>{renderLink(link)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-10 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-white/50 font-medium">{t("company.ownershipStatement")}</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-xs text-white/30">
              <div className="max-w-xs text-center md:text-left">
                <p className="font-bold text-white/50 mb-1">Contra Estatistica Digital Marketers LLC</p>
                <p>1209 Mountain Road Pl NE, Ste R, Albuquerque, NM 87110, US<br />EIN: 39-4917931</p>
              </div>
              <div className="hidden md:block w-px h-10 bg-white/10" />
              <div className="block md:hidden w-16 h-px bg-white/10" />
              <div className="max-w-xs text-center md:text-left">
                <p className="font-bold text-white/50 mb-1">SELLCORE LTD.</p>
                <p>{t("company.registration")}: C 62598 • Saint Kitts and Nevis<br />Suites 5 Horsford's Business Centre, Charlestown, Nevis</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/25 text-center">
            © {new Date().getFullYear()} Educly. {t("landing.footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

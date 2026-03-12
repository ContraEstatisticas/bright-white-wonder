import { Star, Users, Globe, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden ld-navy">
      {/* Hero Glow — half-sphere */}
      <div className="ld-hero-glow" />

      {/* Radial dark gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_150%,hsl(25_90%_55%/0.12),transparent_55%)]" />

      {/* Floating elements */}
      <div className="absolute top-32 right-[15%] w-20 h-20 border border-white/10 rounded-2xl rotate-12 ld-float hidden lg:block" />
      <div className="absolute top-48 left-[12%] w-14 h-14 bg-[hsl(25,90%,55%,0.15)] rounded-full ld-float-d1 hidden lg:block" />
      <div className="absolute bottom-40 right-[22%] w-10 h-10 border border-white/5 rounded-lg rotate-45 ld-float-d2 hidden lg:block" />

      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10 relative z-10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-6"
          >
            <span className="ld-eyebrow text-[hsl(25,90%,55%)] tracking-widest text-xs">
              🚀 {t("landing.features.sectionLabel")}
            </span>
          </motion.div>

          {/* Title — 5.75rem on desktop */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease }}
            className="font-display ld-h1 text-4xl md:text-6xl lg:text-[5.75rem] text-white mb-8"
          >
            {t("landing.hero.title")}{" "}
            <span className="ld-gradient-text">{t("landing.hero.titleHighlight")}</span>
            {" "}{t("landing.hero.titleEnd")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
            className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a href="/#plano">
              <button className="ld-btn-pill bg-[hsl(25,90%,55%)] text-white px-8 py-4 text-lg flex items-center gap-2 ld-shadow-glow">
                {t("landing.pricing.ctaButton", "Começar Agora")}
                <ArrowRight className="w-5 h-5" />
              </button>
            </a>
            <Link to="/auth">
              <button className="ld-btn-pill border-2 border-white/20 text-white px-8 py-4 text-lg hover:border-white/40 bg-transparent">
                {t("landing.nav.login", "Login")}
              </button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6, ease }}
            className="flex flex-wrap justify-center gap-8 md:gap-12"
          >
            {[
              { icon: Users, value: "50.000+", label: t("landing.hero.students") },
              { icon: Star, value: "4.9", label: t("landing.hero.rating"), stars: true },
              { icon: Globe, value: "150+", label: t("landing.hero.countries") },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.stars ? (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                ) : (
                  <item.icon className="w-5 h-5 text-[hsl(25,90%,55%)]" />
                )}
                <span className="text-sm md:text-base">
                  <strong className="text-white">{item.value}</strong>
                  <span className="text-white/50 ml-1">{item.label}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to cream */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fff7ed] to-transparent dark:from-[hsl(223,25%,14%)]" />
    </section>
  );
};

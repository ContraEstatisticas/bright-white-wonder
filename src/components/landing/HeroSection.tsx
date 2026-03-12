import { Star, Users, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section id="inicio" className="relative pt-28 md:pt-36 pb-20 md:pb-32 overflow-hidden bg-background">
      {/* Hero Glow — adapted from design system */}
      <div className="landing-hero-glow" />

      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />

      {/* Floating decorative elements */}
      <div className="absolute top-32 right-[15%] w-16 h-16 bg-primary/10 rounded-2xl rotate-12 landing-float hidden lg:block" />
      <div className="absolute top-48 left-[10%] w-12 h-12 bg-primary/5 rounded-full landing-float-delayed hidden lg:block" />
      <div className="absolute bottom-32 right-[25%] w-10 h-10 bg-muted-foreground/10 rounded-lg rotate-45 landing-float hidden lg:block" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-[4.75rem] landing-h1 mb-6 text-foreground"
          >
            {t("landing.hero.title")}{" "}
            <span className="landing-gradient-text">
              {t("landing.hero.titleHighlight")}
            </span>
            {" "}{t("landing.hero.titleEnd")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.165, 0.84, 0.44, 1] }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
            className="flex flex-wrap justify-center gap-8 md:gap-12"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm md:text-base">
                <strong className="text-foreground">50.000+</strong>
                <span className="text-muted-foreground ml-1">{t("landing.hero.students")}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <span className="text-sm md:text-base">
                <strong className="text-foreground">4.9</strong>
                <span className="text-muted-foreground ml-1">{t("landing.hero.rating")}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm md:text-base">
                <strong className="text-foreground">150+</strong>
                <span className="text-muted-foreground ml-1">{t("landing.hero.countries")}</span>
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

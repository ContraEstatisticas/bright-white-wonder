import { Smartphone, Bot, BarChart3, BadgeCheck, WifiOff, Gamepad2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Smartphone, titleKey: "landing.features.curriculum.title", descriptionKey: "landing.features.curriculum.description" },
    { icon: Bot, titleKey: "landing.features.mentoring.title", descriptionKey: "landing.features.mentoring.description" },
    { icon: BarChart3, titleKey: "landing.features.community.title", descriptionKey: "landing.features.community.description" },
    { icon: BadgeCheck, titleKey: "landing.features.certification.title", descriptionKey: "landing.features.certification.description" },
    { icon: WifiOff, titleKey: "landing.features.practical.title", descriptionKey: "landing.features.practical.description" },
    { icon: Gamepad2, titleKey: "landing.features.career.title", descriptionKey: "landing.features.career.description" },
  ];

  return (
    <section id="sobre" className="landing-section bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="landing-eyebrow">{t("landing.features.sectionLabel")}</span>
          <h2 className="font-display text-3xl md:text-4xl landing-h2 mt-3 mb-4 text-foreground">
            {t("landing.features.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            {t("landing.features.subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.08,
                ease: [0.165, 0.84, 0.44, 1],
              }}
              className="landing-card p-6 md:p-8"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{t(feature.titleKey)}</h3>
              <p className="text-muted-foreground leading-relaxed">{t(feature.descriptionKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

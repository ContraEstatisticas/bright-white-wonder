import { Smartphone, Bot, BarChart3, BadgeCheck, WifiOff, Gamepad2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

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
    <section id="sobre" className="ld-section ld-cream">
      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="ld-eyebrow text-[hsl(25,90%,55%)]">{t("landing.features.sectionLabel")}</span>
          <h2 className="font-display ld-h2 text-3xl md:text-4xl lg:text-[3.5rem] mt-4 mb-5 text-[#111827] dark:text-white">
            {t("landing.features.title")}
          </h2>
          <p className="text-[#111827]/60 dark:text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
            {t("landing.features.subtitle")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: index * 0.08, ease }}
              className="bg-white dark:bg-white/5 p-8 md:p-10 rounded-2xl ld-card ld-shadow-subtle group"
            >
              <div className="w-14 h-14 bg-[hsl(25,90%,55%,0.1)] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[hsl(25,90%,55%,0.15)] ld-ease">
                <feature.icon className="w-7 h-7 text-[hsl(25,90%,55%)]" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-[#111827] dark:text-white ld-h3">{t(feature.titleKey)}</h3>
              <p className="text-[#111827]/60 dark:text-white/60 leading-relaxed">{t(feature.descriptionKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

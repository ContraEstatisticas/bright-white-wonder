import { Globe, Languages, Headphones, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export const GlobalReachSection = () => {
  const { t } = useTranslation();

  const regions = [
    { name: t("landing.globalReach.regions.latinAmerica"), students: "25.000+", flag: "🌎" },
    { name: t("landing.globalReach.regions.europe"), students: "12.000+", flag: "🌍" },
    { name: t("landing.globalReach.regions.northAmerica"), students: "8.000+", flag: "🌎" },
    { name: t("landing.globalReach.regions.asiaOceania"), students: "5.000+", flag: "🌏" },
  ];

  const features = [
    { icon: Languages, title: t("landing.globalReach.features.languages.title"), description: t("landing.globalReach.features.languages.description") },
    { icon: Headphones, title: t("landing.globalReach.features.support.title"), description: t("landing.globalReach.features.support.description") },
    { icon: Users, title: t("landing.globalReach.features.community.title"), description: t("landing.globalReach.features.community.description") },
  ];

  return (
    <section className="landing-section bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="landing-eyebrow">{t("landing.globalReach.sectionLabel")}</span>
          <h2 className="font-display text-3xl md:text-4xl landing-h2 mt-3 mb-4 text-foreground">
            {t("landing.globalReach.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            {t("landing.globalReach.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Globe Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
            className="relative"
          >
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Background Circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-primary/20" />
              </div>
              <div className="absolute inset-8 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-accent/20" />
              </div>
              <div className="absolute inset-16 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-accent/10" />
              </div>

              {/* Center Globe */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-primary rounded-full flex items-center justify-center landing-shadow-glow">
                  <Globe className="w-16 h-16 md:w-20 md:h-20 text-primary-foreground" />
                </div>
              </div>

              {/* Region Dots */}
              {regions.map((region, i) => {
                const positions = [
                  { top: "10%", left: "60%" },
                  { top: "30%", right: "5%" },
                  { bottom: "20%", left: "15%" },
                  { bottom: "30%", right: "20%" },
                ];
                return (
                  <div
                    key={region.name}
                    className="absolute landing-card p-3 landing-float"
                    style={{ ...positions[i], animationDelay: `${i * 0.5}s` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{region.flag}</span>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{region.name}</div>
                        <div className="text-xs text-primary font-bold">{region.students}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.165, 0.84, 0.44, 1] }}
                className="flex gap-4 p-4 rounded-xl hover:bg-muted landing-transition"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}

            {/* Region Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {regions.map((region) => (
                <div key={region.name} className="p-4 landing-card">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{region.flag}</span>
                    <span className="text-sm font-medium text-foreground">{region.name}</span>
                  </div>
                  <div className="text-lg font-bold text-primary">{region.students}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

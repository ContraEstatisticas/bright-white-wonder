import { Globe, Languages, Headphones, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

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
    <section className="ld-section ld-cream relative overflow-hidden">
      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <span className="ld-eyebrow text-[hsl(25,90%,55%)]">{t("landing.globalReach.sectionLabel")}</span>
          <h2 className="font-display ld-h2 text-3xl md:text-4xl lg:text-[3.5rem] text-[#111827] dark:text-white mt-4 mb-5">
            {t("landing.globalReach.title")}
          </h2>
          <p className="text-[#111827]/50 dark:text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            {t("landing.globalReach.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease }}
            className="relative"
          >
            <div className="aspect-square max-w-md mx-auto relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-[hsl(25,90%,55%,0.15)]" />
              </div>
              <div className="absolute inset-8 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-[hsl(25,90%,55%,0.1)]" />
              </div>
              <div className="absolute inset-16 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[hsl(25,90%,55%,0.08)] to-transparent" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 md:w-44 md:h-44 bg-[hsl(25,90%,55%)] rounded-full flex items-center justify-center ld-shadow-glow">
                  <Globe className="w-16 h-16 md:w-20 md:h-20 text-white" />
                </div>
              </div>

              {regions.map((region, i) => {
                const positions = [
                  { top: "8%", left: "60%" },
                  { top: "30%", right: "2%" },
                  { bottom: "18%", left: "12%" },
                  { bottom: "28%", right: "18%" },
                ];
                return (
                  <div
                    key={region.name}
                    className="absolute bg-white dark:bg-white/10 rounded-xl p-3 ld-shadow-subtle ld-float"
                    style={{ ...positions[i], animationDelay: `${i * 0.5}s` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{region.flag}</span>
                      <div>
                        <div className="text-xs font-bold text-[#111827] dark:text-white">{region.name}</div>
                        <div className="text-xs font-bold text-[hsl(25,90%,55%)]">{region.students}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Features */}
          <div className="space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12, ease }}
                className="flex gap-5 p-5 rounded-2xl hover:bg-white dark:hover:bg-white/5 ld-ease group"
              >
                <div className="w-14 h-14 bg-[hsl(25,90%,55%,0.1)] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(25,90%,55%,0.15)] ld-ease">
                  <feature.icon className="w-7 h-7 text-[hsl(25,90%,55%)]" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold mb-1 text-[#111827] dark:text-white">{feature.title}</h3>
                  <p className="text-[#111827]/60 dark:text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}

            {/* Region Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {regions.map((region) => (
                <div key={region.name} className="p-5 bg-white dark:bg-white/5 rounded-xl ld-shadow-subtle">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{region.flag}</span>
                    <span className="text-sm font-medium text-[#111827] dark:text-white">{region.name}</span>
                  </div>
                  <div className="text-xl font-black text-[hsl(25,90%,55%)]">{region.students}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

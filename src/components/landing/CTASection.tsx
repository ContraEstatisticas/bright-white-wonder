import { ArrowRight, Check, Shield, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

export const CTASection = () => {
  const { t } = useTranslation();
  const benefits = [
    t("landing.cta.benefits.0"),
    t("landing.cta.benefits.1"),
    t("landing.cta.benefits.2"),
    t("landing.cta.benefits.3"),
    t("landing.cta.benefits.4"),
    t("landing.cta.benefits.5"),
  ];

  return (
    <section className="ld-section ld-navy relative overflow-hidden">
      {/* Big glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[hsl(25,90%,55%,0.1)] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="font-display ld-h2 text-3xl md:text-4xl lg:text-[3.5rem] text-white mb-6"
          >
            {t("landing.cta.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {t("landing.cta.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12 max-w-xl mx-auto text-left"
          >
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-white/70">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm md:text-base">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="mb-10"
          >
            <a href="/#plano">
              <button className="ld-btn-pill bg-[hsl(25,90%,55%)] text-white px-10 py-5 text-lg font-black ld-shadow-glow flex items-center gap-2 mx-auto">
                {t("landing.pricing.ctaButton", "Começar Agora")}
                <ArrowRight className="w-5 h-5" />
              </button>
            </a>
          </motion.div>

          {/* Trust */}
          <div className="flex flex-wrap justify-center gap-8 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>{t("landing.cta.guarantee")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>{t("landing.cta.installments")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

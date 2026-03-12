import { Check, Shield, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

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
    <section className="landing-section bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-muted rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-muted rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
            className="font-display text-3xl md:text-4xl lg:text-5xl landing-h2 text-foreground mb-6"
          >
            {t("landing.cta.title")}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.165, 0.84, 0.44, 1] }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            {t("landing.cta.subtitle")}
          </motion.p>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.165, 0.84, 0.44, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 max-w-xl mx-auto text-left"
          >
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm md:text-base">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 text-muted-foreground text-sm">
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

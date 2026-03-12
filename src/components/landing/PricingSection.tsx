import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Zap, Check } from "lucide-react";
import { CreditCardLogos } from "@/components/landing/CreditCardLogos";
import { RecurringBillingDisclosure } from "@/components/checkout/RecurringBillingDisclosure";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

export const PricingSection = () => {
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleCheckout = () => {
    window.open("https://pay.hotmart.com/Y103941140D?off=mdspiens&checkoutMode=10", "_blank");
  };

  return (
    <section id="plano" className="ld-section ld-navy relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[hsl(25,90%,55%,0.08)] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="ld-eyebrow text-[hsl(25,90%,55%)]">💎 {t("landing.pricing.offerBadge", "Oferta")}</span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
              className="font-display ld-h2 text-3xl md:text-4xl lg:text-[3.5rem] text-white mt-4 mb-5"
            >
              {t("landing.pricing.title")}
            </motion.h2>
            <p className="text-white/50 text-lg">{t("landing.pricing.subtitle")}</p>
          </div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="relative bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 mb-8 ld-shadow-xl"
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[hsl(25,90%,55%)] text-white text-xs font-black px-5 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Zap size={12} fill="currentColor" /> {t("landing.pricing.offerBadge")}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[hsl(25,90%,55%,0.15)] flex items-center justify-center">
                  <Zap size={28} className="text-[hsl(25,90%,55%)]" fill="currentColor" />
                </div>
                <div>
                  <h4 className="font-black text-white text-2xl tracking-tight mb-1">{t("landing.pricing.productName")}</h4>
                  <p className="text-lg">
                    <span className="font-bold text-[hsl(25,90%,55%)] uppercase">
                      {t("landing.pricing.pricePrefix")} USD 29,90
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-[hsl(25,90%,55%,0.1)] border border-[hsl(25,90%,55%,0.2)] px-10 py-5 rounded-2xl text-center">
                <p className="text-3xl font-black text-[hsl(25,90%,55%)] leading-none">USD 0,90</p>
                <p className="text-[10px] font-bold text-[hsl(25,90%,55%,0.6)] uppercase tracking-widest mt-1">
                  {t("landing.pricing.perDay")}
                </p>
              </div>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 pt-8 border-t border-white/10">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm">{t(`landing.cta.benefits.${i}`)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Terms + CTA */}
          <div className="space-y-5">
            <div className="flex items-start gap-3 px-2">
              <Checkbox
                id="terms-accept"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-[hsl(25,90%,55%)] data-[state=checked]:border-[hsl(25,90%,55%)]"
              />
              <label htmlFor="terms-accept" className="text-sm text-white/50 leading-relaxed cursor-pointer">
                {t("checkout.termsCheckbox")}{" "}
                <Link to="/termos" className="text-[hsl(25,90%,55%)] underline hover:text-[hsl(25,90%,65%)] ld-ease" target="_blank">
                  {t("checkout.termsCheckboxTerms")}
                </Link>{" "}
                {t("checkout.termsCheckboxAnd")}{" "}
                <Link to="/cancelamento" className="text-[hsl(25,90%,55%)] underline hover:text-[hsl(25,90%,65%)] ld-ease" target="_blank">
                  {t("checkout.termsCheckboxRefund")}
                </Link>
              </label>
            </div>

            <button
              onClick={handleCheckout}
              disabled={!termsAccepted}
              className="w-full ld-btn-pill bg-[hsl(25,90%,55%)] text-white font-black py-5 text-lg md:text-xl ld-shadow-glow uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              {t("landing.pricing.ctaButton")}
            </button>

            <CreditCardLogos size="md" className="py-2" />
            <RecurringBillingDisclosure price="29.90" frequency="monthly" />
          </div>

          {/* Quiz */}
          <div className="flex justify-center mt-10">
            <button
              onClick={() => window.open("https://start.educly.app/quiz-esp-hot01", "_blank")}
              className="ld-btn-pill border-2 border-[hsl(25,90%,55%,0.3)] text-[hsl(25,90%,55%)] bg-transparent flex items-center gap-3 hover:border-[hsl(25,90%,55%,0.6)] px-8"
            >
              <Sparkles size={18} className="animate-pulse" />
              <span className="font-black text-sm uppercase tracking-tight">
                {t("landing.pricing.quizDiscountNotice")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

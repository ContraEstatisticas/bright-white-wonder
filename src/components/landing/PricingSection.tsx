import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditCardLogos } from "@/components/landing/CreditCardLogos";
import { RecurringBillingDisclosure } from "@/components/checkout/RecurringBillingDisclosure";
import { motion } from "framer-motion";

export const PricingSection = () => {
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleCheckout = () => {
    window.open("https://pay.hotmart.com/Y103941140D?off=mdspiens&checkoutMode=10", "_blank");
  };

  const plans = [
    {
      name: t("landing.pricing.productName"),
      price: "29,90",
      daily: "0,90",
      popular: true,
    },
  ];

  return (
    <section id="plano" className="landing-section bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
              className="text-3xl md:text-5xl landing-h2 text-foreground"
            >
              {t("landing.pricing.title")}
            </motion.h2>
            <p className="text-muted-foreground text-lg">{t("landing.pricing.subtitle")}</p>
          </div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.165, 0.84, 0.44, 1] }}
            className="grid gap-4"
          >
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col md:flex-row items-center justify-between p-8 rounded-2xl border-2 landing-transition",
                  plan.popular
                    ? "border-primary bg-card landing-shadow-glow scale-[1.02] z-10"
                    : "border-border bg-card",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-4 py-1 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
                    <Zap size={10} fill="currentColor" /> {t("landing.pricing.offerBadge")}
                  </div>
                )}

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <div className="text-center md:text-left">
                    <h4 className="font-black text-foreground text-xl tracking-tight">{plan.name}</h4>
                    <p className="text-base">
                      <span className="font-bold text-primary uppercase">
                        {t("landing.pricing.pricePrefix")} USD {plan.price}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 bg-primary/5 px-8 py-4 rounded-2xl border border-primary/10 text-center min-w-[140px]">
                  <p className="text-2xl font-black text-primary leading-none">USD {plan.daily}</p>
                  <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1">
                    {t("landing.pricing.perDay")}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Checkbox + Checkout Button */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 px-2">
              <Checkbox
                id="terms-accept"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms-accept" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                {t("checkout.termsCheckbox")}{" "}
                <Link to="/termos" className="text-primary underline hover:text-primary/80 font-semibold landing-transition" target="_blank">
                  {t("checkout.termsCheckboxTerms")}
                </Link>{" "}
                {t("checkout.termsCheckboxAnd")}{" "}
                <Link to="/cancelamento" className="text-primary underline hover:text-primary/80 font-semibold landing-transition" target="_blank">
                  {t("checkout.termsCheckboxRefund")}
                </Link>
              </label>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={!termsAccepted}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-9 rounded-2xl text-sm sm:text-lg md:text-2xl landing-shadow-glow landing-transition active:scale-[0.98] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("landing.pricing.ctaButton")}
            </Button>

            <CreditCardLogos size="md" className="py-2" />
            <RecurringBillingDisclosure price="29.90" frequency="monthly" />
          </div>

          {/* Quiz Discount */}
          <div className="relative py-6">
            <div className="relative flex justify-center">
              <button
                onClick={() => window.open("https://start.educly.app/quiz-esp-hot01", "_blank")}
                className="bg-primary/5 border-2 border-primary/40 px-8 py-3 rounded-full flex items-center gap-3 animate-bounce landing-shadow-soft landing-btn-hover"
              >
                <Sparkles size={20} className="text-primary animate-pulse" />
                <span className="text-primary font-black text-sm md:text-base uppercase tracking-tight">
                  {t("landing.pricing.quizDiscountNotice")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

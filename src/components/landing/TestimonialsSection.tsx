import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

export const TestimonialsSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    { nameKey: "landing.testimonials.items.0.name", roleKey: "landing.testimonials.items.0.role", countryKey: "landing.testimonials.items.0.country", textKey: "landing.testimonials.items.0.text", avatar: "MS", rating: 5 },
    { nameKey: "landing.testimonials.items.1.name", roleKey: "landing.testimonials.items.1.role", countryKey: "landing.testimonials.items.1.country", textKey: "landing.testimonials.items.1.text", avatar: "JS", rating: 5 },
    { nameKey: "landing.testimonials.items.2.name", roleKey: "landing.testimonials.items.2.role", countryKey: "landing.testimonials.items.2.country", textKey: "landing.testimonials.items.2.text", avatar: "AG", rating: 5 },
    { nameKey: "landing.testimonials.items.3.name", roleKey: "landing.testimonials.items.3.role", countryKey: "landing.testimonials.items.3.country", textKey: "landing.testimonials.items.3.text", avatar: "CF", rating: 5 },
  ];

  return (
    <section id="depoimentos" className="ld-section ld-navy relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[hsl(25,90%,55%,0.05)] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <span className="ld-eyebrow text-[hsl(25,90%,55%)]">{t("landing.testimonials.sectionLabel")}</span>
          <h2 className="font-display ld-h2 text-3xl md:text-4xl lg:text-[3.5rem] text-white mt-4 mb-5">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.nameKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: index * 0.1, ease }}
              className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-2xl ld-card group"
            >
              <Quote className="w-10 h-10 text-[hsl(25,90%,55%,0.3)] mb-5" />

              <div className="flex gap-1 mb-5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              <p className="text-white/80 mb-8 leading-relaxed text-lg">"{t(testimonial.textKey)}"</p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[hsl(25,90%,55%)] flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{t(testimonial.nameKey)}</div>
                  <div className="text-sm text-white/40">
                    {t(testimonial.roleKey)} • {t(testimonial.countryKey)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

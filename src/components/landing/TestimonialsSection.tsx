import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export const TestimonialsSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    { nameKey: "landing.testimonials.items.0.name", roleKey: "landing.testimonials.items.0.role", countryKey: "landing.testimonials.items.0.country", textKey: "landing.testimonials.items.0.text", avatar: "MS", rating: 5 },
    { nameKey: "landing.testimonials.items.1.name", roleKey: "landing.testimonials.items.1.role", countryKey: "landing.testimonials.items.1.country", textKey: "landing.testimonials.items.1.text", avatar: "JS", rating: 5 },
    { nameKey: "landing.testimonials.items.2.name", roleKey: "landing.testimonials.items.2.role", countryKey: "landing.testimonials.items.2.country", textKey: "landing.testimonials.items.2.text", avatar: "AG", rating: 5 },
    { nameKey: "landing.testimonials.items.3.name", roleKey: "landing.testimonials.items.3.role", countryKey: "landing.testimonials.items.3.country", textKey: "landing.testimonials.items.3.text", avatar: "CF", rating: 5 },
  ];

  return (
    <section id="depoimentos" className="landing-section bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="landing-eyebrow">{t("landing.testimonials.sectionLabel")}</span>
          <h2 className="font-display text-3xl md:text-4xl landing-h2 mt-3 mb-4 text-foreground">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.nameKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.165, 0.84, 0.44, 1] }}
              className="landing-card p-6 md:p-8"
            >
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-primary/20 mb-4" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">"{t(testimonial.textKey)}"</p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{t(testimonial.nameKey)}</div>
                  <div className="text-sm text-muted-foreground">
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

import { useState, useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

export const TestimonialsSection = () => {
  const { t } = useTranslation();
  const titleRef = useRef<HTMLDivElement>(null);
  const [titleVisible, setTitleVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const testimonials = [
    {
      nameKey: "landing.testimonials.items.0.name",
      roleKey: "landing.testimonials.items.0.role",
      countryKey: "landing.testimonials.items.0.country",
      textKey: "landing.testimonials.items.0.text",
      avatar: "MS",
      rating: 5,
    },
    {
      nameKey: "landing.testimonials.items.1.name",
      roleKey: "landing.testimonials.items.1.role",
      countryKey: "landing.testimonials.items.1.country",
      textKey: "landing.testimonials.items.1.text",
      avatar: "JS",
      rating: 5,
    },
    {
      nameKey: "landing.testimonials.items.2.name",
      roleKey: "landing.testimonials.items.2.role",
      countryKey: "landing.testimonials.items.2.country",
      textKey: "landing.testimonials.items.2.text",
      avatar: "AG",
      rating: 5,
    },
    {
      nameKey: "landing.testimonials.items.3.name",
      roleKey: "landing.testimonials.items.3.role",
      countryKey: "landing.testimonials.items.3.country",
      textKey: "landing.testimonials.items.3.text",
      avatar: "CF",
      rating: 5,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTitleVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '10px' }
    );
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="depoimentos" className="py-16 md:py-24 bg-surface">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            {t('landing.testimonials.sectionLabel')}
          </span>
          <div style={{ overflow: 'hidden' }} ref={titleRef}>
            <h2
              className="font-display text-3xl md:text-4xl font-bold mt-2 mb-4"
              style={{
                letterSpacing: '-0.05em',
                transform: titleVisible ? 'translateY(0)' : 'translateY(120%)',
                transition: 'transform 0.9s cubic-bezier(.165,.84,.44,1)',
              }}
            >
              {t('landing.testimonials.title')}
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('landing.testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => {
            const isHovered = hoveredCard === testimonial.nameKey;
            return (
              <div
                key={testimonial.nameKey}
                className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-soft animate-fade-in-up cursor-default"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  transition: 'all 0.6s cubic-bezier(.165,.84,.44,1)',
                  boxShadow: isHovered
                    ? 'inset 0 0 0 500px rgba(69,65,254,0.05), 0 8px 32px rgba(69,65,254,0.10)'
                    : undefined,
                }}
                onMouseEnter={() => setHoveredCard(testimonial.nameKey)}
                onMouseLeave={() => setHoveredCard(null)}
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
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ background: 'linear-gradient(135deg, #4541fe, #fe0e83)' }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{t(testimonial.nameKey)}</div>
                    <div className="text-sm text-muted-foreground">
                      {t(testimonial.roleKey)} • {t(testimonial.countryKey)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

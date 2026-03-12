import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

const useCountUp = (end: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, start]);

  return count;
};

export const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const stats = [
    { value: 50000, labelKey: "landing.stats.students", suffix: "+" },
    { value: 100, labelKey: "landing.stats.countries", suffix: "+" },
    { value: 98, labelKey: "landing.stats.satisfaction", suffix: "%" },
    { value: 500, labelKey: "landing.stats.partners", suffix: "+" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
    <section
      ref={sectionRef}
      className="py-16 md:py-20 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9f0ff 100%)' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 150%, rgba(69,65,254,0.08), transparent 70%)' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div ref={titleRef} style={{ overflow: 'hidden' }} className="text-center mb-10">
          <h2
            className="font-display text-2xl md:text-3xl font-bold"
            style={{
              letterSpacing: '-0.05em',
              transform: titleVisible ? 'translateY(0)' : 'translateY(120%)',
              transition: 'transform 0.9s cubic-bezier(.165,.84,.44,1)',
            }}
          >
            {t('landing.stats.title', 'Números que falam por si')}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const isHovered = hoveredCard === stat.labelKey;
            return (
              <div
                key={stat.labelKey}
                className="rounded-2xl border border-border p-6 text-center cursor-default"
                style={{
                  transition: 'all 0.6s cubic-bezier(.165,.84,.44,1)',
                  boxShadow: isHovered
                    ? 'inset 0 0 0 500px rgba(69,65,254,0.06), 0 8px 32px rgba(69,65,254,0.12)'
                    : '0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
                  background: 'white',
                }}
                onMouseEnter={() => setHoveredCard(stat.labelKey)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <StatCard
                  value={stat.value}
                  label={t(stat.labelKey)}
                  suffix={stat.suffix}
                  isVisible={isVisible}
                  delay={index * 200}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const StatCard = ({
  value,
  label,
  suffix,
  isVisible,
  delay
}: {
  value: number;
  label: string;
  suffix: string;
  isVisible: boolean;
  delay: number;
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const count = useCountUp(value, 2000, shouldAnimate);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShouldAnimate(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay]);

  return (
    <>
      <div
        className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-2"
        style={{
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, #4541fe, #fe0e83)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-600 dark:text-slate-400 text-sm md:text-base">{label}</div>
    </>
  );
};

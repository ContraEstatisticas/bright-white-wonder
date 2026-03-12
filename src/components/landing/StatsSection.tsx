import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const useCountUp = (end: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration, start]);

  return count;
};

export const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
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
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.labelKey}
              value={stat.value}
              label={t(stat.labelKey)}
              suffix={stat.suffix}
              isVisible={isVisible}
              delay={index * 200}
              index={index}
            />
          ))}
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
  delay,
  index,
}: {
  value: number;
  label: string;
  suffix: string;
  isVisible: boolean;
  delay: number;
  index: number;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.165, 0.84, 0.44, 1] }}
      className="text-center"
    >
      <div className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 landing-h2">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-muted-foreground text-sm md:text-base">{label}</div>
    </motion.div>
  );
};

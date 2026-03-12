import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

const useCountUp = (end: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let ts: number | null = null;
    const step = (t: number) => {
      if (!ts) ts = t;
      const p = Math.min((t - ts) / duration, 1);
      setCount(Math.floor(p * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
};

export const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  const stats = [
    { value: 50000, labelKey: "landing.stats.students", suffix: "+" },
    { value: 100, labelKey: "landing.stats.countries", suffix: "+" },
    { value: 98, labelKey: "landing.stats.satisfaction", suffix: "%" },
    { value: 500, labelKey: "landing.stats.partners", suffix: "+" },
  ];

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-28 ld-cream relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-60 h-60 border border-[hsl(25,90%,55%,0.08)] rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 border border-[hsl(25,90%,55%,0.06)] rounded-full" />
      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatCard key={stat.labelKey} stat={stat} index={index} isVisible={isVisible} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ stat, index, isVisible, t }: { stat: { value: number; labelKey: string; suffix: string }; index: number; isVisible: boolean; t: (k: string) => string }) => {
  const [anim, setAnim] = useState(false);
  const count = useCountUp(stat.value, 2000, anim);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setAnim(true), index * 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease }}
      className="text-center"
    >
      <div className="font-display ld-h1 text-4xl md:text-5xl lg:text-[3.5rem] text-[#111827] dark:text-white mb-2">
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div className="text-[#111827]/50 dark:text-white/50 text-sm md:text-base font-medium">{t(stat.labelKey)}</div>
    </motion.div>
  );
};

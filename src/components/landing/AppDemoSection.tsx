import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const ease = [0.165, 0.84, 0.44, 1] as const;

export const AppDemoSection = () => {
  const { t } = useTranslation();

  return (
    <section className="ld-section ld-navy relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(25 90% 55% / 0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-[87.5rem] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <span className="ld-eyebrow text-[hsl(25,90%,55%)]">
            {t("landing.appDemo.label", "VEJA EM AÇÃO")}
          </span>
          <h2 className="font-display ld-h2 text-3xl md:text-4xl lg:text-[3.5rem] text-white mt-4 mb-5">
            {t("landing.appDemo.title", "Veja a plataforma em ação")}
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            {t("landing.appDemo.subtitle", "Explore nossa interface intuitiva e descubra como a IA pode transformar sua carreira")}
          </p>
        </div>

        {/* Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease }}
          className="flex justify-center"
        >
          <div className="relative">
            {/* Glow behind phone */}
            <div
              className="absolute -inset-12 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 40%, hsl(25 90% 55% / 0.12) 0%, transparent 55%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Phone device */}
            <div className="relative w-[280px] sm:w-[320px] md:w-[380px] rounded-[3rem] bg-[#0a0a0a] p-[8px] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]">
              {/* Inner bezel */}
              <div className="relative w-full rounded-[2.4rem] overflow-hidden bg-black">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[22px] bg-black rounded-full z-30" />

                {/* Video container — clips top 40px to hide recording indicator */}
                <div className="relative w-full aspect-[9/19.5] overflow-hidden">
                  <video
                    src="/videos/app-demo.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-[calc(100%+40px)] object-cover"
                    style={{ marginTop: '-40px' }}
                  />
                </div>

                {/* Home indicator bar */}
                <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[110px] h-[4px] bg-white/20 rounded-full z-30" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

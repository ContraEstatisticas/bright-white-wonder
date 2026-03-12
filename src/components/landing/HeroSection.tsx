import { Star, Users, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section
      id="inicio"
      className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #101722 0%, #0d1520 100%)' }}
    >
      {/* Hero circle glow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          top: '-10vw',
          width: '80vw',
          height: '50vw',
          borderRadius: '150% 150% 0% 0%',
          background: '#4541fe',
          boxShadow: '40px 0 36rem 10rem #4541fe',
          filter: 'blur(0.6rem)',
          opacity: 0.35,
        }}
      />

      {/* Subtle radial overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle closest-corner at 50% 100%, rgba(69,65,254,0.18), transparent)',
        }}
      />

      {/* Floating decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(254,14,131,0.08)' }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(69,65,254,0.12)' }} />

      {/* Floating shapes */}
      <div className="absolute top-32 right-[15%] w-16 h-16 rounded-2xl rotate-12 animate-float hidden lg:block" style={{ background: 'rgba(69,65,254,0.2)' }} />
      <div className="absolute top-48 left-[10%] w-12 h-12 rounded-full animate-float-delayed hidden lg:block" style={{ background: 'rgba(254,14,131,0.2)' }} />
      <div className="absolute bottom-32 right-[25%] w-10 h-10 rounded-lg rotate-45 animate-float hidden lg:block" style={{ background: 'rgba(255,255,255,0.1)' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated gradient heading */}
          <style>{`
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .hero-gradient-text {
              background: linear-gradient(135deg, #4541fe 0%, #fe0e83 40%, #4541fe 80%, #0ac9c0 100%);
              background-size: 300% 300%;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              color: transparent;
              animation: gradientShift 6s ease infinite;
              padding-right: 0.02em;
            }
          `}</style>

          {/* Title */}
          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up stagger-1 text-white"
            style={{ letterSpacing: '-0.05em', lineHeight: 1 }}
          >
            {t('landing.hero.title')}{" "}
            <span className="hero-gradient-text">
              {t('landing.hero.titleHighlight')}
            </span>
            {" "}{t('landing.hero.titleEnd')}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto animate-fade-in-up stagger-2">
            {t('landing.hero.subtitle')}
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 animate-fade-in-up stagger-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#4541fe' }} />
              <span className="text-sm md:text-base">
                <strong className="text-white">50.000+</strong>
                <span className="text-white/60 ml-1">{t('landing.hero.students')}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-sm md:text-base">
                <strong className="text-white">4.9</strong>
                <span className="text-white/60 ml-1">{t('landing.hero.rating')}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#0ac9c0' }} />
              <span className="text-sm md:text-base">
                <strong className="text-white">150+</strong>
                <span className="text-white/60 ml-1">{t('landing.hero.countries')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

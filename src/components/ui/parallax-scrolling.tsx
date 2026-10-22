import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

interface ParallaxComponentProps {
  title?: string;
  subtitle?: string;
  onExploreClick?: () => void;
}

export function ParallaxComponent({
  title = "BATTTWIN",
  subtitle = "Cell-to-System Multi-Physics & Deterministic Safety Governance",
  onExploreClick,
}: ParallaxComponentProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0,
        },
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 },
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none",
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (triggerElement) gsap.killTweensOf(triggerElement);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="parallax relative w-full overflow-hidden" ref={parallaxRef}>
      <section className="parallax__header relative w-full min-h-[90vh] md:min-h-screen flex items-center justify-center">
        <div className="parallax__visuals absolute inset-0 w-full h-full overflow-hidden">
          <div className="parallax__black-line-overflow absolute top-0 left-0 right-0 h-1 bg-[#080B08] z-30"></div>
          
          <div data-parallax-layers className="parallax__layers relative w-full h-full flex items-center justify-center">
            {/* Background depth layer 1 */}
            <img
              src="https://cdn.21st.dev/assets/mirror/a4/a43f4eae3459c461345ee676f12d6e1ddca65e8a5279a5af00d475b17ff83aea.webp"
              loading="eager"
              width="800"
              data-parallax-layer="1"
              alt=""
              className="parallax__layer-img absolute w-full max-w-4xl object-cover opacity-60 filter brightness-90 contrast-125"
            />

            {/* Midground layer 2 */}
            <img
              src="https://cdn.21st.dev/assets/mirror/50/50ca6a0d36d2780bfcb469d6db7eaec0be7e0d2961ba69a63d2a1473b040338d.webp"
              loading="eager"
              width="800"
              data-parallax-layer="2"
              alt=""
              className="parallax__layer-img absolute w-full max-w-3xl object-cover opacity-80 filter brightness-105 hue-rotate-15"
            />

            {/* Center typography layer 3 */}
            <div
              data-parallax-layer="3"
              className="parallax__layer-title absolute z-20 text-center px-4 flex flex-col items-center justify-center pointer-events-auto"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#111612]/90 border border-[#1E2A20] text-[#B8FF24] text-xs font-mono uppercase tracking-wider mb-4 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#B8FF24] animate-pulse"></span>
                <span>Cell-To-System Digital Twin</span>
              </div>
              
              <h1 className="parallax__title text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white uppercase select-none drop-shadow-2xl">
                {title.slice(0, 4)}
                <span className="text-[#B8FF24]">{title.slice(4)}</span>
              </h1>
              
              <p className="mt-4 max-w-xl text-sm sm:text-base text-[#8A9A8C] font-medium leading-relaxed">
                {subtitle}
              </p>

              {onExploreClick && (
                <button
                  onClick={onExploreClick}
                  className="mt-6 px-7 py-3 rounded-full bg-[#B8FF24] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#c9ff4d] hover:shadow-[0_0_30px_rgba(184,255,36,0.4)] transition-all cursor-pointer"
                >
                  <span>Enter Engineering Studio</span>
                  <span className="text-base font-normal">↘</span>
                </button>
              )}
            </div>

            {/* Foreground layer 4 */}
            <img
              src="https://cdn.21st.dev/assets/mirror/e1/e1c8137b5f971c3b3ec1a0f9e79b9c17018767005f844a10082b890472afecfb.webp"
              loading="eager"
              width="800"
              data-parallax-layer="4"
              alt=""
              className="parallax__layer-img absolute w-full max-w-2xl object-cover pointer-events-none opacity-90 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Fade mask at bottom to seamlessly blend into dark obsidian background */}
          <div className="parallax__fade absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080B08] via-[#080B08]/80 to-transparent pointer-events-none z-20"></div>
        </div>
      </section>
    </div>
  );
}

export default ParallaxComponent;

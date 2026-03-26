import React, { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Ad {
  id: string;
  type: 'image' | 'video';
  url: string;
  targetUrl?: string;
  alt?: string;
}

interface AdSliderProps {
  ads: Ad[];
}

export const AdSlider: React.FC<AdSliderProps> = ({ ads }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Timer mapping for internal 5-second image auto-scrolling
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Handle active video playback manually
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === selectedIndex) {
        // Reset to beginning and play if it's the active slide
        video.currentTime = 0;
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    });

    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      videoRefs.current[selectedIndex]?.pause();
      return;
    } else {
      videoRefs.current[selectedIndex]?.play().catch(console.error);
    }

    const currentAd = ads[selectedIndex];
    if (!currentAd) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    // If it's an image, forcefully auto-scroll after exactly 5000ms
    if (currentAd.type === 'image') {
      timerRef.current = setTimeout(() => {
        scrollNext();
      }, 5000);
    }
    // If it's a video, the native onEnded DOM event will trigger handleVideoEnded

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selectedIndex, isPaused, ads, scrollNext]);

  const handleVideoEnded = () => {
    if (!isPaused) {
      scrollNext();
    }
  };

  if (!ads || ads.length === 0) return null;

  return (
    <div className="w-full px-2 md:px-6 lg:px-8 mt-4 mb-4">
        <div 
        className="group relative w-full mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-secondary/30 transition-shadow duration-500 hover:shadow-primary/20"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => {
            // slight delay before resuming autoplay on mobile tap release
            setTimeout(() => setIsPaused(false), 2000);
        }}
        >
        <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
            {ads.map((ad, idx) => (
                <div 
                className="flex-[0_0_100%] min-w-0 relative aspect-[16/9] md:aspect-[21/6] lg:aspect-[24/5] bg-black/60 flex items-center justify-center overflow-hidden backdrop-blur-md"
                key={ad.id}
                >
                {/* Visual loading fallback skeleton underneath */}
                <div className="absolute inset-0 bg-secondary animate-pulse -z-10" />

                {ad.type === 'image' ? (
                    <img 
                    src={ad.url} 
                    alt={ad.alt || 'Advertisement'} 
                    className="w-full h-full object-cover transition-transform duration-[10s] ease-linear group-hover:scale-105 select-none"
                    loading="lazy"
                    />
                ) : (
                    <video
                    ref={el => videoRefs.current[idx] = el}
                    src={ad.url}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    muted
                    playsInline
                    onEnded={selectedIndex === idx ? handleVideoEnded : undefined}
                    />
                )}
                </div>
            ))}
            </div>
        </div>

        {/* Dynamic Controls Overlay */}
        {ads.length > 1 && (
            <>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/50 border border-white/10 text-white rounded-full hover:bg-black/80 hover:scale-110 backdrop-blur-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300"
            >
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); scrollNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/50 border border-white/10 text-white rounded-full hover:bg-black/80 hover:scale-110 backdrop-blur-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300"
            >
                <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Seamless Progress Dots Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-xl">
                {ads.map((_, idx) => (
                <button
                    key={idx}
                    className={`h-2 min-h-[8px] flex-shrink-0 rounded-full transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-primary ${idx === selectedIndex ? 'bg-primary w-6 min-w-[24px]' : 'bg-white/40 w-2 min-w-[8px] hover:bg-white/80'}`}
                    onClick={(e) => { e.stopPropagation(); emblaApi?.scrollTo(idx); }}
                    aria-label={`Go to ad ${idx + 1}`}
                />
                ))}
            </div>
            </>
        )}
        </div>
    </div>
  );
};

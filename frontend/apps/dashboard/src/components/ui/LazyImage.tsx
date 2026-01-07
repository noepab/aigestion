import { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  placeholder?: React.ReactNode;
}

export function LazyImage({ src, alt = '', className = '', placeholder }: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading supported
      img.setAttribute('loading', 'lazy');
      img.src = src;
    } else {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              img.src = src;
              observer.unobserve(img);
            }
          });
        },
        { rootMargin: '200px' }
      );
      observer.observe(img);
    }
    const onLoad = () => setIsLoaded(true);
    img.addEventListener('load', onLoad);
    return () => {
      img.removeEventListener('load', onLoad);
    };
  }, [src]);

  return (
    <>{
      placeholder && !isLoaded ? placeholder : null
    }
    <img ref={imgRef} alt={alt} className={className} style={{ display: isLoaded ? undefined : 'none' }} />
    </>
  );
}

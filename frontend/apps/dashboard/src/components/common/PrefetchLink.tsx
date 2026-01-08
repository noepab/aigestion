import React, { useEffect, useRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface PrefetchLinkProps extends LinkProps {
  // Optional: Function to trigger custom prefetch logic (e.g., query client prefetch)
  onPrefetch?: () => void;
}

export const PrefetchLink: React.FC<PrefetchLinkProps> = ({ children, onPrefetch, ...props }) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const prefetched = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetched.current) {
            prefetched.current = true;
            if (onPrefetch) onPrefetch();
            // In a real Vite app, dynamic imports are prefetched automatically if configured,
            // but we can add explicit logic here if needed.
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (linkRef.current) observer.observe(linkRef.current);

    return () => observer.disconnect();
  }, [onPrefetch]);

  const handleMouseEnter = () => {
    if (!prefetched.current) {
      prefetched.current = true;
      if (onPrefetch) onPrefetch();
    }
  };

  return (
    <Link ref={linkRef} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
};

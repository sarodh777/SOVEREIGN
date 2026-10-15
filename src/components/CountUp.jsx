import React, { useState, useEffect } from 'react';

export default function CountUp({ value, duration = 800, prefix = '', suffix = '', decimals = 2, isCurrency = false }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // If user prefers reduced motion, jump directly to final value
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    const target = Number(value) || 0;
    const startValue = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(target);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, duration]);

  const formatted = isCurrency
    ? displayValue.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toFixed(decimals);

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

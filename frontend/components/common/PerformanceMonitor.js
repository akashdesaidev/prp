import { useEffect, useState } from 'react';

const PerformanceMonitor = ({ children }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    // Measure page load performance
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;

        // Measure memory usage (if available)
        const memoryUsage = performance.memory
          ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
          : 0;

        setMetrics((prev) => ({
          ...prev,
          loadTime: Math.round(loadTime),
          memoryUsage
        }));

        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Performance Metrics:', {
            loadTime: `${Math.round(loadTime)}ms`,
            memoryUsage: `${memoryUsage}MB`,
            timing: {
              domContentLoaded: Math.round(
                navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
              ),
              firstPaint: getFirstPaint(),
              firstContentfulPaint: getFirstContentfulPaint()
            }
          });
        }
      }
    };

    // Measure render time
    const renderStart = performance.now();

    const measureRenderTime = () => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      setMetrics((prev) => ({
        ...prev,
        renderTime: Math.round(renderTime)
      }));
    };

    // Measure after component mounts
    setTimeout(measurePerformance, 100);
    setTimeout(measureRenderTime, 0);

    // Set up performance observer for Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (process.env.NODE_ENV === 'development') {
            console.log('LCP:', Math.round(lastEntry.startTime));
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('FID:', Math.round(entry.processingStart - entry.startTime));
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          if (process.env.NODE_ENV === 'development' && clsValue > 0) {
            console.log('CLS:', clsValue.toFixed(4));
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }, []);

  // Helper functions
  const getFirstPaint = () => {
    const paintEntries = performance.getEntriesByType('paint');
    const fpEntry = paintEntries.find((entry) => entry.name === 'first-paint');
    return fpEntry ? Math.round(fpEntry.startTime) : 0;
  };

  const getFirstContentfulPaint = () => {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    return fcpEntry ? Math.round(fcpEntry.startTime) : 0;
  };

  // Performance warning component (development only)
  const PerformanceWarning = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    const warnings = [];

    if (metrics.loadTime > 3000) {
      warnings.push('Slow page load time detected');
    }

    if (metrics.renderTime > 100) {
      warnings.push('Slow render time detected');
    }

    if (metrics.memoryUsage > 50) {
      warnings.push('High memory usage detected');
    }

    if (warnings.length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50 max-w-sm">
        <div className="font-bold">Performance Warning</div>
        <ul className="text-sm mt-1">
          {warnings.map((warning, index) => (
            <li key={index}>• {warning}</li>
          ))}
        </ul>
        <div className="text-xs mt-2 opacity-75">
          Load: {metrics.loadTime}ms | Render: {metrics.renderTime}ms | Memory:{' '}
          {metrics.memoryUsage}MB
        </div>
      </div>
    );
  };

  return (
    <>
      {children}
      <PerformanceWarning />
    </>
  );
};

// Hook for accessing performance metrics
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    navigation: null,
    memory: null,
    timing: null
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const memory = performance.memory;
      const timing = performance.timing;

      setMetrics({
        navigation,
        memory,
        timing
      });
    }
  }, []);

  return metrics;
};

// Performance measurement utilities
export const measureFunction = (fn, name = 'function') => {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} execution time: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  };
};

export const measureAsyncFunction = (fn, name = 'async function') => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} execution time: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  };
};

export default PerformanceMonitor;

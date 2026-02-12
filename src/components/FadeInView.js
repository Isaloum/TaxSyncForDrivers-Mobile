import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Wraps children in a fade-in + slide-up animation.
 * Props:
 *   delay: ms before animation starts (default 0)
 *   duration: animation length in ms (default 300)
 */
export default function FadeInView({ children, delay = 0, duration = 300, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * 20 sequential frames: fully assembled truck → gradually separated →
 * fully exploded chassis view. Scroll position maps directly onto this
 * array — there is no autoplay timer anywhere in this component.
 */
const FRAME_IMAGES = [
  require('../assets/truck-frames/ezgif-frame-001.jpg'),
  require('../assets/truck-frames/ezgif-frame-002.jpg'),
  require('../assets/truck-frames/ezgif-frame-003.jpg'),
  require('../assets/truck-frames/ezgif-frame-004.jpg'),
  require('../assets/truck-frames/ezgif-frame-005.jpg'),
  require('../assets/truck-frames/ezgif-frame-006.jpg'),
  require('../assets/truck-frames/ezgif-frame-007.jpg'),
  require('../assets/truck-frames/ezgif-frame-008.jpg'),
  require('../assets/truck-frames/ezgif-frame-009.jpg'),
  require('../assets/truck-frames/ezgif-frame-010.jpg'),
  require('../assets/truck-frames/ezgif-frame-011.jpg'),
  require('../assets/truck-frames/ezgif-frame-012.jpg'),
  require('../assets/truck-frames/ezgif-frame-013.jpg'),
  require('../assets/truck-frames/ezgif-frame-014.jpg'),
  require('../assets/truck-frames/ezgif-frame-015.jpg'),
  require('../assets/truck-frames/ezgif-frame-016.jpg'),
  require('../assets/truck-frames/ezgif-frame-017.jpg'),
  require('../assets/truck-frames/ezgif-frame-018.jpg'),
  require('../assets/truck-frames/ezgif-frame-019.jpg'),
  require('../assets/truck-frames/ezgif-frame-020.jpg'),
];

const FRAME_COUNT = FRAME_IMAGES.length;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type TruckScrollSequenceProps = {
  /** The parent ScrollView's tracked scroll offset (JS-driven, useNativeDriver: false). */
  scrollY: Animated.Value;
  style?: StyleProp<ViewStyle>;
};

export function TruckScrollSequence({ scrollY, style }: TruckScrollSequenceProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompact = windowWidth < 768;

  // Size of the visible, pinned truck stage.
  const pinHeight = Math.round(
    clamp(windowWidth * (isCompact ? 0.72 : 0.42), isCompact ? 220 : 320, isCompact ? 340 : 560)
  );

  // How much scroll distance it takes to go from assembled to exploded.
  // Enough room to feel intentional, without wasting space on small screens.
  const scrollDistance = Math.round(pinHeight * (isCompact ? 1.6 : 2.4));

  const sectionTopRef = useRef(0);
  const targetFrameRef = useRef(0);
  const targetProgressRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const [frameIndex, setFrameIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleSectionLayout = (event: LayoutChangeEvent) => {
    // y is this section's offset within the ScrollView's content —
    // the same coordinate space as scrollY's contentOffset.
    sectionTopRef.current = event.nativeEvent.layout.y;
  };

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const start = sectionTopRef.current;
      const rawProgress = (value - start) / scrollDistance;
      const clampedProgress = clamp(rawProgress, 0, 1);
      const target = Math.round(clampedProgress * (FRAME_COUNT - 1));

      targetFrameRef.current = target;
      targetProgressRef.current = clampedProgress;

      // Coalesce bursts of scroll events into a single frame update per
      // animation frame — keeps this glued to the scroll position without
      // spamming setState on every native scroll tick.
      if (rafIdRef.current !== null) {
        return;
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setFrameIndex(targetFrameRef.current);
        setProgress(targetProgressRef.current);
        rafIdRef.current = null;
      });
    });

    return () => {
      scrollY.removeListener(listenerId);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [scrollY, scrollDistance]);

  return (
    <View
      style={[styles.section, { height: scrollDistance + pinHeight }, style]}
      onLayout={handleSectionLayout}
    >
      {/* Warm the image cache for every frame up front so scrubbing never
          shows a blank frame, without affecting layout. */}
      <View style={styles.preloadStack} pointerEvents="none">
        {FRAME_IMAGES.map((source, index) => (
          <Image key={index} source={source} style={styles.preloadImage} />
        ))}
      </View>

      <View
        style={[
          styles.pin,
          { height: pinHeight },
          Platform.OS === 'web'
            ? ({ position: 'sticky', top: 0 } as unknown as ViewStyle)
            : styles.pinNative,
        ]}
      >
        <View style={styles.stage}>
          <Image
            source={FRAME_IMAGES[frameIndex]}
            resizeMode="contain"
            style={styles.truckImage}
          />

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default TruckScrollSequence;

const styles = StyleSheet.create({
  section: {
    width: '100%',
    position: 'relative',
  },

  preloadStack: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },

  preloadImage: {
    width: 1,
    height: 1,
  },

  pin: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  pinNative: {
    position: 'relative',
  },

  stage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#7C8CA6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  truckImage: {
    width: '100%',
    height: '100%',
  },

  progressTrack: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 14,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});

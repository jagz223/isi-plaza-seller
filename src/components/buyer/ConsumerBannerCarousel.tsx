import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { IsiPlazaColors, IsiPlazaRadius } from '@/constants/isi-plaza';
import { recordConsumerBannerClick } from '@/services/api/consumer';
import type { ConsumerBanner } from '@/types/consumer-api';

const SLIDE_DURATION_MS = 400;
export const CONSUMER_BANNER_HEIGHT = 140;

type SlidePair = {
  currentIndex: number;
  nextIndex: number;
};

type BannerSlideProps = {
  banner: ConsumerBanner;
  width: number;
  onPress?: () => void;
};

function BannerSlide({ banner, width, onPress }: BannerSlideProps) {
  const hasLink = Boolean(banner.link_url?.trim());

  return (
    <Pressable
      style={[styles.slide, { width }]}
      disabled={!hasLink}
      onPress={onPress}
      accessibilityRole={hasLink ? 'link' : undefined}
      accessibilityLabel={hasLink ? 'Abrir enlace del banner' : undefined}>
      {banner.image_url ? (
        <Image
          source={{ uri: banner.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Banner</Text>
        </View>
      )}
    </Pressable>
  );
}

type ConsumerBannerCarouselProps = {
  banners: ConsumerBanner[];
  width: number;
  intervalMs?: number;
  onBannerPress?: (banner: ConsumerBanner) => void;
};

export function ConsumerBannerCarousel({
  banners,
  width,
  intervalMs = 2000,
  onBannerPress,
}: ConsumerBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidePair, setSlidePair] = useState<SlidePair | null>(null);

  const translateX = useSharedValue(0);
  const layoutWidth = useSharedValue(width);
  const isAnimatingRef = useRef(false);
  const activeIndexRef = useRef(0);
  const pendingResetRef = useRef(false);

  const handleBannerPress = useCallback(
    async (banner: ConsumerBanner) => {
      if (onBannerPress) {
        onBannerPress(banner);
        return;
      }

      if (!banner.link_url?.trim()) {
        return;
      }

      const targetUrl = banner.link_url.trim();
      void recordConsumerBannerClick(banner.id).catch(() => {});

      try {
        const canOpen = await Linking.canOpenURL(targetUrl);
        if (canOpen) {
          await Linking.openURL(targetUrl);
        }
      } catch {
        // Sin acción si el dispositivo no puede abrir la URL.
      }
    },
    [onBannerPress],
  );

  useEffect(() => {
    layoutWidth.value = width;
    if (!isAnimatingRef.current && !pendingResetRef.current && width > 0) {
      translateX.value = -width;
    }
  }, [width, layoutWidth, translateX]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
    activeIndexRef.current = 0;
    setSlidePair(null);
    pendingResetRef.current = false;
    isAnimatingRef.current = false;
    cancelAnimation(translateX);
    translateX.value = width > 0 ? -width : 0;
  }, [banners, translateX, width]);

  const completeSlide = useCallback((nextIndex: number) => {
    pendingResetRef.current = true;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    isAnimatingRef.current = false;
  }, []);

  useLayoutEffect(() => {
    if (!pendingResetRef.current) {
      return;
    }

    pendingResetRef.current = false;
    const slideWidth = layoutWidth.value;
    if (slideWidth > 0) {
      translateX.value = -slideWidth;
    }
    setSlidePair(null);
  }, [activeIndex, layoutWidth, translateX]);

  const advance = useCallback(() => {
    if (banners.length < 2 || isAnimatingRef.current) {
      return;
    }

    const slideWidth = layoutWidth.value;
    if (slideWidth <= 0) {
      return;
    }

    const fromIndex = activeIndexRef.current;
    const toIndex = (fromIndex + 1) % banners.length;

    setSlidePair({ currentIndex: fromIndex, nextIndex: toIndex });
    isAnimatingRef.current = true;

    cancelAnimation(translateX);
    translateX.value = -slideWidth;
    translateX.value = withTiming(
      0,
      { duration: SLIDE_DURATION_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(completeSlide)(toIndex);
        } else {
          runOnJS(() => {
            isAnimatingRef.current = false;
            setSlidePair(null);
          })();
        }
      },
    );
  }, [banners.length, completeSlide, layoutWidth, translateX]);

  useEffect(() => {
    if (banners.length < 2) {
      return;
    }

    const timer = setInterval(() => advance(), intervalMs);
    return () => clearInterval(timer);
  }, [banners.length, intervalMs, advance]);

  const trackStyle = useAnimatedStyle(() => ({
    width: layoutWidth.value * 2,
    transform: [{ translateX: translateX.value }],
  }));

  const currentIndex = slidePair?.currentIndex ?? activeIndex;
  const nextIndex = slidePair?.nextIndex ?? (activeIndex + 1) % banners.length;

  const current = banners[currentIndex];
  const next = banners[nextIndex];

  if (!current) {
    return null;
  }

  if (banners.length < 2 || !next) {
    return (
      <View style={[styles.viewport, { width, height: CONSUMER_BANNER_HEIGHT }]}>
        <BannerSlide
          banner={current}
          width={width}
          onPress={() => void handleBannerPress(current)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.viewport, { width, height: CONSUMER_BANNER_HEIGHT }]}>
      <Animated.View style={[styles.track, trackStyle]} collapsable={false}>
        <BannerSlide
          banner={next}
          width={width}
          onPress={() => void handleBannerPress(next)}
        />
        <BannerSlide
          banner={current}
          width={width}
          onPress={() => void handleBannerPress(current)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    borderRadius: IsiPlazaRadius.sm,
  },
  track: {
    flexDirection: 'row',
    height: CONSUMER_BANNER_HEIGHT,
  },
  slide: {
    height: CONSUMER_BANNER_HEIGHT,
    borderRadius: IsiPlazaRadius.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: IsiPlazaColors.textSecondary,
  },
});

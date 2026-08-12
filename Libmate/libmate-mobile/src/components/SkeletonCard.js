import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

function SkeletonBox({ style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return <Animated.View style={[{ opacity, backgroundColor: '#E5E7EB', borderRadius: 6 }, style]} />;
}

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

export function GridSkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBox style={styles.cover} />
      <View style={styles.info}>
        <SkeletonBox style={styles.titleLine} />
        <SkeletonBox style={styles.authorLine} />
        <SkeletonBox style={styles.genreLine} />
      </View>
    </View>
  );
}

export function HorizontalSkeletonCard() {
  return (
    <View style={styles.hCard}>
      <SkeletonBox style={styles.hCover} />
      <View style={styles.info}>
        <SkeletonBox style={styles.titleLine} />
        <SkeletonBox style={styles.authorLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 2,
  },
  cover: { width: '100%', height: 160, borderRadius: 0 },
  info: { padding: 10, gap: 6 },
  titleLine: { height: 12, width: '80%' },
  authorLine: { height: 10, width: '60%' },
  genreLine: { height: 10, width: '40%' },

  hCard: {
    width: 140,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 2,
  },
  hCover: { width: '100%', height: 180, borderRadius: 0 },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function FleetVisualFallback({ compact = false }: { compact?: boolean }) {
  const drive = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(drive, {
      toValue: 1,
      duration: 5200,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [drive]);

  const scale = compact ? 0.76 : 1;
  const translateX = drive.interpolate({ inputRange: [0, 1], outputRange: [-24 * scale, 58 * scale] });

  return (
    <View style={[styles.stage, { transform: [{ scale }] }]} pointerEvents="none">
      <View style={styles.route} />
      <Animated.View style={[styles.truck, { transform: [{ translateX }] }]}>
        <View style={styles.trailer} />
        <View style={styles.cabin}><View style={styles.window} /></View>
        <View style={styles.wheelBack} /><View style={styles.wheelFront} />
        <MaterialCommunityIcons name="truck-fast" size={42} color="rgba(255,255,255,0.16)" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: 330, height: 188, justifyContent: 'flex-end', overflow: 'hidden' },
  route: { position: 'absolute', left: 20, right: 20, bottom: 42, height: 2, backgroundColor: 'rgba(164,218,214,0.4)' },
  truck: { position: 'absolute', left: 92, bottom: 42, width: 140, height: 67, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 8 },
  trailer: { flex: 1, height: 48, borderRadius: 5, backgroundColor: '#19434A', borderWidth: 1, borderColor: 'rgba(190,240,234,0.34)' },
  cabin: { width: 42, height: 54, borderRadius: 7, backgroundColor: '#2BA7A5', marginLeft: 4, padding: 5 },
  window: { height: 22, borderRadius: 4, backgroundColor: '#17323B' },
  wheelBack: { position: 'absolute', left: 25, bottom: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#111B20', borderWidth: 4, borderColor: '#66777A' },
  wheelFront: { position: 'absolute', right: 10, bottom: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#111B20', borderWidth: 4, borderColor: '#66777A' },
});

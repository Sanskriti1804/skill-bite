import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "../icons";
import { colors, radii, space } from "../theme";

type Props = {
  onFinished?: () => void;
};

export function SplashScreen({ onFinished }: Props) {
  const logo = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logo, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
    return () => {
      onFinished?.();
    };
  }, [logo, onFinished, pulse]);

  const scale = logo.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbA} />
      <View style={styles.orbB} />
      <Animated.View style={[styles.markWrap, { transform: [{ scale }], opacity: glow }]}>
        <View style={styles.markGlow} />
        <View style={styles.mark}>
          <Icon name="learnActive" size={34} color={colors.accentInk} />
        </View>
      </Animated.View>
      <Animated.Text
        style={[
          styles.brand,
          {
            opacity: logo,
            transform: [{ translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
      >
        SkillBite
      </Animated.Text>
      <Text style={styles.tag}>Learn in motion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  orbA: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(46,230,197,0.12)",
    top: "18%",
    left: -40,
  },
  orbB: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(91,140,255,0.14)",
    bottom: "16%",
    right: -30,
  },
  markWrap: { alignItems: "center", justifyContent: "center", marginBottom: space.lg },
  markGlow: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.glow,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  tag: {
    marginTop: space.sm,
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});

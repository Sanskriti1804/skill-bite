import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppLogo } from "../components/AppLogo";
import { colors, font } from "../theme";

type Props = {
  onFinished?: () => void;
};

export function SplashScreen({ onFinished }: Props) {
  const logo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onFinished?.();
    };

    Animated.timing(logo, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(finish, 900);
    return () => {
      clearTimeout(timer);
      finish();
    };
  }, [logo, onFinished]);

  const scale = logo.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbA} />
      <View style={styles.orbB} />

      <View style={styles.top}>
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
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.markWrap, { transform: [{ scale }], opacity: logo }]}>
          <AppLogo size={112} />
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.tag}>Learn in motion</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  orbA: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(59,130,196,0.18)",
    top: "18%",
    left: -40,
  },
  orbB: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(27,42,74,0.08)",
    bottom: "16%",
    right: -30,
  },
  top: {
    height: "20%",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    height: "20%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
    paddingBottom: "5%",
  },
  markWrap: { alignItems: "center", justifyContent: "center" },
  brand: {
    color: colors.ink,
    fontSize: 36,
    fontFamily: font.display,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  tag: {
    color: colors.inkMuted,
    fontSize: 14,
    fontFamily: font.medium,
    fontWeight: "600",
    textAlign: "center",
  },
});

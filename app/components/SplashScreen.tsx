import React, { useEffect, useContext } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/src/context/AuthContext';
import LuvaBrancaColors from '@/lib/ui/styles/luvabranca-colors';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate based on authentication state after animation
    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/images/luva-branca-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <ActivityIndicator 
        size="large" 
        color={LuvaBrancaColors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuvaBrancaColors.backgrounds.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: width * 0.7,
    height: width * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen; 
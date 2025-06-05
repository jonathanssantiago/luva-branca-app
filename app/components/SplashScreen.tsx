import React, { useEffect, useRef } from 'react'
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import LuvaBrancaColors from '@/lib/ui/styles/luvabranca-colors'

const { width } = Dimensions.get('window')

const CustomSplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // Inicia as animações
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
    ]).start()

    // Mantém o splash screen visível durante as animações
    const timer = setTimeout(() => {
      SplashScreen.hideAsync()
    }, 1500)

    return () => clearTimeout(timer)
  }, [fadeAnim, scaleAnim])

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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuvaBrancaColors.primary,
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
})

export default CustomSplashScreen

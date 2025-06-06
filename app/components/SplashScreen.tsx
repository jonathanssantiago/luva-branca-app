import React, { useEffect, useRef } from 'react'
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  useColorScheme,
} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import LuvaBrancaColors from '@/lib/ui/styles/luvabranca-colors'

const { width } = Dimensions.get('window')

const CustomSplashScreen = () => {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Inicia as animações em sequência suave
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 8,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start()

    // Mantém o splash screen visível durante as animações
    const timer = setTimeout(() => {
      SplashScreen.hideAsync()
    }, 1800)

    return () => clearTimeout(timer)
  }, [fadeAnim, scaleAnim, rotateAnim])


  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={[styles.container]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/images/luva-branca-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.View style={{ opacity: fadeAnim }}>
        <ActivityIndicator
          size="large"
        color={LuvaBrancaColors.primary}
          style={styles.loader}
        />
      </Animated.View>
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
    width: width * 0.3,
    height: width * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logo: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 20,
  },
})

export default CustomSplashScreen

import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SnackbarType } from '@/src/hooks/useAppSnackbar'

interface AppSnackbarProps {
  visible: boolean
  message: string | null | undefined
  type: SnackbarType
  onDismiss: () => void
}

const CONFIG: Record<
  SnackbarType,
  { bg: string; icon: string; hasAction: boolean; duration: number }
> = {
  success: {
    bg: '#2E7D32',
    icon: 'check-circle',
    hasAction: false,
    duration: 3000,
  },
  error: {
    bg: '#C62828',
    icon: 'alert-circle',
    hasAction: true,
    duration: 5000,
  },
  warning: {
    bg: '#E65100',
    icon: 'alert',
    hasAction: true,
    duration: 4000,
  },
  info: {
    bg: '#1565C0',
    icon: 'information',
    hasAction: false,
    duration: 2500,
  },
}

export const AppSnackbar: React.FC<AppSnackbarProps> = ({
  visible,
  message,
  type,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const config = CONFIG[type]

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        handleDismiss()
      }, config.duration)
    } else {
      translateY.setValue(-100)
      opacity.setValue(0)
      if (timerRef.current) clearTimeout(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, type])

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss()
    })
  }

  if (!visible) return null

  return (
    <Animated.View
      style={[
        snackStyles.wrapper,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[snackStyles.container, { backgroundColor: config.bg }]}>
        <MaterialCommunityIcons
          name={config.icon as any}
          size={20}
          color="#FFFFFF"
          style={snackStyles.icon}
        />
        <Text style={snackStyles.message} numberOfLines={3}>
          {message}
        </Text>
        {config.hasAction && (
          <Text style={snackStyles.action} onPress={handleDismiss}>
            OK
          </Text>
        )}
      </View>
    </Animated.View>
  )
}

const snackStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  action: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
})

import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

interface CustomHeaderProps {
  title: string
  backgroundColor?: string
  textColor?: string
  iconColor?: string
  leftIcon?: string
  rightIcon?: string
  onLeftPress?: () => void
  onRightPress?: () => void
  showBackButton?: boolean
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  backgroundColor,
  textColor,
  iconColor,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBackButton = true,
}) => {
  const insets = useSafeAreaInsets()
  const colors = useThemeExtendedColors()

  const headerBackgroundColor = backgroundColor || colors.surface
  const headerTextColor = textColor || colors.textPrimary
  const headerIconColor = iconColor || colors.iconPrimary

  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress()
    } else if (showBackButton) {
      router.back()
    }
  }

  return (
    <View style={[styles.header, { 
      backgroundColor: headerBackgroundColor, 
      paddingTop: insets.top + 16,
      shadowColor: colors.shadow || '#000'
    }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleLeftPress}
        >
          <MaterialCommunityIcons
            name={(leftIcon || 'arrow-left') as any}
            size={24}
            color={headerIconColor}
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: headerTextColor }]}>
          {title}
        </Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onRightPress}
        >
          {rightIcon && (
            <MaterialCommunityIcons
              name={rightIcon as any}
              size={24}
              color={headerIconColor}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
}) 
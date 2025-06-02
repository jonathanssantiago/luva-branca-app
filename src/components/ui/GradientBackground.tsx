import { LinearGradient } from 'expo-linear-gradient'
import { useWindowDimensions } from 'react-native'
import { useTheme } from 'react-native-paper'

const GradientBackground = (props: { height?: 'full' }) => {
  const theme = useTheme()
  const { height, width } = useWindowDimensions()

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.inversePrimary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        left: 0,
        right: 0,
        position: 'absolute',
        height: props.height ? height : 300,
        width,
      }}
    />
  )
}

export default GradientBackground

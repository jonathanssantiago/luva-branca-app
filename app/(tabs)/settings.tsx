import * as SecureStore from 'expo-secure-store'
import React from 'react'
import { Platform, useColorScheme, Dimensions } from 'react-native'
import {
  Surface,
  List,
  Menu,
  Button,
  IconButton,
  Icon,
  Text,
} from 'react-native-paper'

import {
  Color,
  Language,
  Languages,
  LoadingIndicator,
  Locales,
  Setting,
  styles,
} from '@/lib'
import { ScreenContainer } from '@/src/components/ui'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import { PermissionsStatus } from '@/src/components/PermissionsStatus'
import {
  useTheme as useCustomTheme,
  useThemeExtendedColors,
} from '@/src/context/ThemeContext'

const { width } = Dimensions.get('window')

const Settings = () => {
  const { themeMode, setThemeMode, isDark } = useCustomTheme()
  const colors = useThemeExtendedColors()
  const colorScheme = useColorScheme() ?? 'light'
  const [loading, setLoading] = React.useState<boolean>(false)
  const [settings, setSettings] = React.useState<Setting>({
    color: 'default',
    language: 'pt',
    theme: 'auto',
  })
  const [display, setDisplay] = React.useState({
    language: false,
    theme: false,
  })

  React.useEffect(() => {
    setLoading(true)

    if (Platform.OS !== 'web') {
      SecureStore.getItemAsync('settings')
        .then((result) =>
          setSettings(JSON.parse(result ?? JSON.stringify(settings))),
        )
        .catch((res) => {
          console.error('Erro ao carregar configurações:', res)
        })
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <ScreenContainer
        scrollable
        contentStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: colors.background,
        }}
      >
        {/* Título da tela */}
        <Text
          variant="headlineMedium"
          style={{
            textAlign: 'center',
            marginBottom: 8,
            color: colors.textPrimary,
            fontWeight: 'bold',
            fontSize: width < 400 ? 24 : 28,
          }}
        >
          Configurações
        </Text>

        <Text
          variant="bodyMedium"
          style={{
            textAlign: 'center',
            marginBottom: 24,
            color: colors.textSecondary,
            lineHeight: 20,
          }}
        >
          Personalize sua experiência no app
        </Text>

        {loading ? (
          <LoadingIndicator />
        ) : (
          <Surface
            elevation={0}
            style={{
              backgroundColor: 'transparent',
              flex: 1,
            }}
          >
            <List.AccordionGroup>
              <List.Accordion
                id="1"
                title="Idioma"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="translate"
                    color={colors.primary}
                  />
                )}
                titleStyle={{ color: colors.textPrimary }}
                style={{ backgroundColor: colors.surface }}
              >
                <List.Item
                  title={Locales.t('language')}
                  description={Locales.t('changeLanguage')}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="translate"
                      color={colors.iconSecondary}
                    />
                  )}
                  titleStyle={{ color: colors.textPrimary }}
                  descriptionStyle={{ color: colors.textSecondary }}
                  style={{ backgroundColor: colors.surface }}
                  right={(props) => (
                    <Menu
                      visible={display.language}
                      onDismiss={() =>
                        setDisplay({ ...display, language: false })
                      }
                      anchor={
                        <IconButton
                          {...props}
                          icon="pencil"
                          iconColor={colors.primary}
                          onPress={() =>
                            setDisplay({ ...display, language: true })
                          }
                        />
                      }
                      contentStyle={{ backgroundColor: colors.surface }}
                    >
                      <Menu.Item
                        title="Sistema"
                        titleStyle={{ color: colors.textPrimary }}
                        trailingIcon={
                          settings.language === 'auto' ? 'check' : undefined
                        }
                        onPress={() => {
                          const newSettings = {
                            ...settings,
                            language: 'auto' as Language,
                          }
                          setSettings(newSettings)
                          // Salvar automaticamente
                          if (Platform.OS !== 'web') {
                            SecureStore.setItemAsync(
                              'settings',
                              JSON.stringify(newSettings),
                            )
                          }
                          setDisplay({ ...display, language: false })
                        }}
                      />
                      {Object.entries(Languages).map((lang) => (
                        <Menu.Item
                          key={lang[0]}
                          title={`${lang[1].name} / ${lang[1].nativeName}`}
                          titleStyle={{ color: colors.textPrimary }}
                          trailingIcon={
                            settings.language === lang[0] ? 'check' : undefined
                          }
                          onPress={() => {
                            const newSettings = {
                              ...settings,
                              language: lang[0] as Language,
                            }
                            setSettings(newSettings)
                            // Salvar automaticamente
                            if (Platform.OS !== 'web') {
                              SecureStore.setItemAsync(
                                'settings',
                                JSON.stringify(newSettings),
                              )
                            }
                            setDisplay({ ...display, language: false })
                          }}
                        />
                      ))}
                    </Menu>
                  )}
                />
              </List.Accordion>

              <List.Accordion
                id="2"
                title={Locales.t('appearance')}
                left={(props) => (
                  <List.Icon {...props} icon="palette" color={colors.primary} />
                )}
                titleStyle={{ color: colors.textPrimary }}
                style={{ backgroundColor: colors.surface }}
              >
                <List.Item
                  title={Locales.t('mode')}
                  description={Locales.t('changeMode')}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        themeMode === 'auto'
                          ? 'theme-light-dark'
                          : themeMode === 'light'
                            ? 'weather-sunny'
                            : 'weather-night'
                      }
                      color={colors.iconSecondary}
                    />
                  )}
                  titleStyle={{ color: colors.textPrimary }}
                  descriptionStyle={{ color: colors.textSecondary }}
                  style={{ backgroundColor: colors.surface }}
                  right={(props) => (
                    <Menu
                      visible={display.theme}
                      onDismiss={() => setDisplay({ ...display, theme: false })}
                      anchor={
                        <IconButton
                          {...props}
                          icon="pencil"
                          iconColor={colors.primary}
                          onPress={() =>
                            setDisplay({ ...display, theme: true })
                          }
                        />
                      }
                      contentStyle={{ backgroundColor: colors.surface }}
                    >
                      <Menu.Item
                        title="Sistema"
                        leadingIcon="theme-light-dark"
                        titleStyle={{ color: colors.textPrimary }}
                        trailingIcon={
                          themeMode === 'auto' ? 'check' : undefined
                        }
                        onPress={() => {
                          setThemeMode('auto')
                          setDisplay({ ...display, theme: false })
                        }}
                      />
                      <Menu.Item
                        title="Modo Claro"
                        leadingIcon="weather-sunny"
                        titleStyle={{ color: colors.textPrimary }}
                        trailingIcon={
                          themeMode === 'light' ? 'check' : undefined
                        }
                        onPress={() => {
                          setThemeMode('light')
                          setDisplay({ ...display, theme: false })
                        }}
                      />
                      <Menu.Item
                        title="Modo Escuro"
                        leadingIcon="weather-night"
                        titleStyle={{ color: colors.textPrimary }}
                        trailingIcon={
                          themeMode === 'dark' ? 'check' : undefined
                        }
                        onPress={() => {
                          setThemeMode('dark')
                          setDisplay({ ...display, theme: false })
                        }}
                      />
                    </Menu>
                  )}
                />
                <List.Item
                  title={Locales.t('color')}
                  description="Tema Luva Branca (padrão)"
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="palette-swatch-variant"
                      color={colors.iconSecondary}
                    />
                  )}
                  titleStyle={{ color: colors.textPrimary }}
                  descriptionStyle={{ color: colors.textSecondary }}
                  style={{ backgroundColor: colors.surface }}
                  right={() => (
                    <Icon size={24} source="check" color={colors.primary} />
                  )}
                />
              </List.Accordion>

              <List.Accordion
                id="3"
                title="Permissões"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="shield-check"
                    color={colors.primary}
                  />
                )}
                titleStyle={{ color: colors.textPrimary }}
                style={{ backgroundColor: colors.surface }}
              >
                <PermissionsStatus />
              </List.Accordion>
            </List.AccordionGroup>
          </Surface>
        )}
      </ScreenContainer>
    </>
  )
}

export default Settings

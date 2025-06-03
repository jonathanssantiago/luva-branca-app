# 🛡️ Luva Branca

> **Sua segurança em primeiro lugar**

Um aplicativo mobile de segurança desenvolvido com React Native e Expo, focado em proporcionar uma experiência de autenticação simples e segura através de CPF, com recursos avançados de privacidade e segurança.

## 📱 Sobre o Projeto

O **Luva Branca** é um aplicativo de segurança que oferece autenticação rápida e cadastro simplificado para usuários brasileiros. Com design moderno e interface intuitiva, o app prioriza a facilidade de uso sem comprometer a segurança, incluindo recursos avançados de privacidade e modo disfarçado.

### ✨ Funcionalidades Principais

- 🔐 **Autenticação por CPF** - Login seguro usando documento brasileiro
- 📝 **Cadastro Rápido** - Registro simplificado com dados essenciais
- 🎨 **Design Moderno** - Interface limpa e responsiva
- 📱 **Totalmente Mobile** - Otimizado para smartphones
- 🌈 **Tema Personalizado** - Paleta de cores exclusiva "Luva Branca"
- ⚡ **Performance** - Carregamento rápido e animações suaves
- 🕵️ **Modo Disfarçado** - Interface alternativa para maior privacidade
- 🔒 **Configurações de Privacidade** - Controle total sobre seus dados
- 📊 **Dashboard Personalizado** - Visualização de dados e estatísticas
- 🔔 **Sistema de Notificações** - Alertas e atualizações em tempo real

### 🔧 Funcionalidades Técnicas

#### Autenticação e Segurança
- ✅ Formatação automática de CPF
- ✅ Validação de formulário em tempo real
- ✅ Estados de loading e feedback visual
- ✅ Navegação para cadastro
- ✅ Link "Esqueci minha senha"
- ✅ Autenticação local com biometria
- ✅ Armazenamento seguro de dados

#### Privacidade e Configurações
- ✅ Modo disfarçado com interface alternativa
- ✅ Configurações de privacidade detalhadas
- ✅ Gerenciamento de dados pessoais
- ✅ Controle de notificações
- ✅ Configurações do aplicativo

## 🚀 Tecnologias Utilizadas

### Core
- **React Native** - Framework principal
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **Expo Router** - Navegação entre telas
- **Supabase** - Backend e autenticação

### UI/UX
- **React Native Paper** - Componentes Material Design
- **React Native Reanimated** - Animações performáticas
- **Expo Linear Gradient** - Gradientes visuais
- **React Native Safe Area Context** - Gerenciamento de área segura
- **Expo Image** - Otimização de imagens

### Segurança e Armazenamento
- **Expo Secure Store** - Armazenamento seguro
- **Expo Local Authentication** - Autenticação biométrica
- **Expo Crypto** - Funções criptográficas
- **Expo File System** - Gerenciamento de arquivos

### Formulários e Validação
- **Formik** - Gerenciamento de formulários
- **Yup** - Validação de schema

### Internacionalização
- **i18n-js** - Suporte a múltiplos idiomas
- **Expo Localization** - Detecção de idioma

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Android Studio ou Xcode (para emuladores)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/luva-branca.git
cd luva-branca
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure o ambiente Expo**
```bash
npx expo install
```

4. **Execute o projeto**
```bash
# Desenvolvimento
npm start
# ou
yarn start

# Android
npm run android

# iOS (apenas macOS)
npm run ios

# Web
npm run web
```

## 📁 Estrutura do Projeto

```
luva-branca/
├── app/                          # Diretório principal do app
│   ├── (auth)/                   # Grupo de autenticação
│   ├── (tabs)/                   # Navegação por abas
│   ├── components/               # Componentes compartilhados
│   ├── disguised-mode.tsx        # Modo disfarçado
│   ├── privacy.tsx              # Configurações de privacidade
│   ├── notifications.tsx        # Sistema de notificações
│   ├── app-settings.tsx         # Configurações do app
│   ├── personal-data.tsx        # Dados pessoais
│   └── _layout.tsx              # Layout principal
├── assets/                       # Recursos estáticos
├── lib/                         # Bibliotecas e utilitários
├── src/                         # Código fonte
└── supabase/                    # Configuração do Supabase
```

## 🛠️ Scripts Disponíveis

```json
{
  "start": "NODE_ENV=development expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web",
  "test": "jest --watchAll",
  "lint": "eslint . --fix",
  "expo:fix": "expo install --fix",
  "expo:lint": "expo lint",
  "format": "prettier -w ."
}
```

## 🚀 Próximas Funcionalidades

- [ ] Integração com redes sociais
- [ ] Backup automático de dados
- [ ] Modo offline aprimorado
- [ ] Análise de segurança em tempo real
- [ ] Relatórios de atividade
- [ ] Suporte a múltiplos idiomas
- [ ] Temas personalizáveis

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use TypeScript para tipagem
- Siga os padrões ESLint configurados
- Mantenha componentes pequenos e reutilizáveis
- Documente funções complexas
- Adicione testes para novas funcionalidades

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvedor

Desenvolvido com 💖 para sua segurança.

---

### 📞 Suporte

Em caso de dúvidas ou problemas:
- Abra uma [issue](https://github.com/jonathanssantiago/luva-branca-app/issues)
- Entre em contato via email
- Consulte a documentação

**Luva Branca** - Sua segurança em primeiro lugar! 🛡️
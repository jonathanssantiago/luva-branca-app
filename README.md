# 🛡️ Luva Branca

> **Sua segurança em primeiro lugar**

Um aplicativo mobile de segurança desenvolvido com React Native e Expo, focado em proporcionar uma experiência de autenticação simples e segura através de CPF.

## 📱 Sobre o Projeto

O **Luva Branca** é um aplicativo de segurança que oferece autenticação rápida e cadastro simplificado para usuários brasileiros. Com design moderno e interface intuitiva, o app prioriza a facilidade de uso sem comprometer a segurança.

### ✨ Funcionalidades Principais

- 🔐 **Autenticação por CPF** - Login seguro usando documento brasileiro
- 📝 **Cadastro Rápido** - Registro simplificado com dados essenciais
- 🎨 **Design Moderno** - Interface limpa e responsiva
- 📱 **Totalmente Mobile** - Otimizado para smartphones
- 🌈 **Tema Personalizado** - Paleta de cores exclusiva "Luva Branca"
- ⚡ **Performance** - Carregamento rápido e animações suaves

### 🔧 Funcionalidades Técnicas

#### Tela de Login
- ✅ Formatação automática de CPF
- ✅ Validação de formulário em tempo real
- ✅ Estados de loading e feedback visual
- ✅ Navegação para cadastro
- ✅ Link "Esqueci minha senha"

#### Tela de Cadastro
- ✅ Campo de nome completo
- ✅ CPF com formatação automática
- ✅ Data de nascimento (DD/MM/AAAA)
- ✅ Seleção de gênero via dropdown
- ✅ Telefone com formatação automática
- ✅ Validação robusta com Yup

## 🚀 Tecnologias Utilizadas

### Core
- **React Native** - Framework principal
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas

### UI/UX
- **React Native Paper** - Componentes Material Design
- **React Native Reanimated** - Animações performáticas
- **Expo Linear Gradient** - Gradientes visuais
- **React Native Safe Area Context** - Gerenciamento de área segura

### Formulários e Validação
- **Formik** - Gerenciamento de formulários
- **Yup** - Validação de schema
- **React Hook Form** - Formulários performáticos

### Ícones e Imagens
- **Material Community Icons** - Biblioteca de ícones
- **Expo Image** - Otimização de imagens

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
npm start
# ou
yarn start
```

5. **Execute em dispositivos**
```bash
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
│   │   ├── login.tsx            # Tela de login
│   │   └── signup.tsx           # Tela de cadastro
│   ├── (tabs)/                  # Navegação por abas
│   └── _layout.tsx              # Layout principal
├── assets/                       # Recursos estáticos
│   ├── images/                  # Imagens e ícones
│   └── fonts/                   # Fontes customizadas
├── lib/                         # Bibliotecas e utilitários
│   ├── ui/                      # Componentes de UI
│   │   └── styles/              # Estilos globais
│   └── utils/                   # Funções utilitárias
├── src/                         # Código fonte
│   ├── components/              # Componentes reutilizáveis
│   ├── context/                 # Contextos React
│   ├── hooks/                   # Hooks customizados
│   └── services/                # Serviços e APIs
└── package.json                 # Dependências do projeto
```

## 🎨 Design System

### Paleta de Cores "Luva Branca"
```typescript
const LuvaBrancaColors = {
  primary: '#E91E63',           // Rosa principal
  primaryWithOpacity: (opacity) => `rgba(233, 30, 99, ${opacity})`,
  onPrimary: '#FFFFFF',         // Texto sobre o primário
  textPrimary: '#1A1A1A',       // Texto principal
  textSecondary: '#666666',     // Texto secundário
  border: '#E0E0E0',            // Bordas
  backgrounds: {
    card: '#FFFFFF',            // Fundo dos cards
    surface: '#F8F9FA',         // Superfícies
  }
}
```

### Componentes Reutilizáveis
- 🎛️ **TextInput customizado** com validação
- 🔘 **Botões padronizados** com loading
- 📋 **Menu dropdown** para seleções
- ⚠️ **Helper texts** para feedback

## 📱 Capturas de Tela

### Tela de Login
- Interface limpa com gradiente rosa
- Logo centralizado com efeito de sombra
- Campos de CPF e senha com validação
- Botão de login com estado de loading

### Tela de Cadastro
- Formulário completo e organizado
- Formatação automática de dados
- Seleção de gênero via menu
- Design consistente com o login

## 🔄 Fluxo de Navegação

```
Inicialização
    ↓
Tela de Login
    ↓ (sucesso)
Dashboard Principal
    ↓
Navegação por Abas

Tela de Login
    ↓ (cadastro)
Tela de Cadastro
    ↓ (sucesso)
Volta para Login
```

## 🛠️ Scripts Disponíveis

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "build": "expo build",
  "eject": "expo eject"
}
```

## 🧪 Validações Implementadas

### CPF
- Formato: 000.000.000-00
- Validação de tamanho mínimo
- Formatação automática durante digitação

### Data de Nascimento
- Formato: DD/MM/AAAA
- Limitação de caracteres
- Validação de formato completo

### Telefone
- Formato: (11) 99999-9999
- Suporte a números fixos e celulares
- Formatação automática

### Nome Completo
- Mínimo 3 caracteres
- Capitalização automática
- Validação de preenchimento

## 🚀 Próximas Funcionalidades

- [ ] Recuperação de senha
- [ ] Autenticação biométrica
- [ ] Notificações push
- [ ] Dashboard personalizado
- [ ] Configurações de perfil
- [ ] Modo offline
- [ ] Integração com APIs externas

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
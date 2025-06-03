# 🥸 Modo Disfarçado - Luva Branca

## 📋 Visão Geral

O **Modo Disfarçado** é uma funcionalidade de segurança crítica do app Luva Branca que permite às usuárias esconderem o verdadeiro propósito do aplicativo quando estão sob vigilância ou em situações de risco.

Quando ativado, o app se transforma em um aplicativo de receitas culinárias convincente, protegendo a identidade e segurança da usuária.

## 🎯 Funcionalidades Implementadas

### ✅ Configuração de Privacidade

- **Localização**: `app/privacy.tsx`
- **Toggle** para ativar/desativar o modo disfarçado
- **Confirmação** obrigatória antes da ativação
- **Persistência** segura usando SecureStore

### ✅ Interface Disfarçada

- **Localização**: `app/disguised-mode.tsx`
- App de receitas culinárias **completo e convincente**
- **3 receitas** com ingredientes e instruções detalhadas
- **Design** profissional e realista
- **Navegação** entre lista e detalhes das receitas

### ✅ Detecção de Gestos Secretos

- **Localização**: `src/components/ui/SecretGestureDetector.tsx`
- **5 toques rápidos** no título para acessar o app real
- **Janela de 2 segundos** para completar a sequência
- **Detecção** na mesma área da tela
- **Configurável** (número de toques, tempo, área)

### ✅ Botão de Emergência Disfarçado

- **Seção "Receitas Favoritas"** no final da lista
- **Pressionar e segurar por 3 segundos** para ativar
- **Ativação silenciosa** de emergência sem sair do modo disfarçado
- **Ícone de coração** para parecer uma funcionalidade normal

### ✅ Feedback Visual

- **Overlay** com confirmação quando o modo secreto é ativado
- **Ícone de escudo** e mensagem "Modo Seguro Ativado"
- **Transição suave** para o app real
- **Indicador** de redirecionamento

### ✅ Navegação Inteligente

- **Redirecionamento automático** quando o modo está ativo
- **Verificação** no `_layout.tsx` na inicialização
- **Rota dedicada** `/disguised-mode`
- **Integração** com sistema de autenticação

## 🔧 Como Usar

### Para Ativar o Modo Disfarçado:

1. **Abra o app** Luva Branca normalmente
2. **Navegue** para Configurações → Privacidade
3. **Ative** a opção "Modo Disfarçado"
4. **Confirme** a ativação no dialog
5. **O app será reiniciado** como um app de receitas

### Para Acessar o App Real (do Modo Disfarçado):

1. **Toque 5 vezes rapidamente** no título "Dicas de Culinária"
2. **Complete os toques em 2 segundos** na mesma área
3. **Aguarde** a confirmação visual
4. **O app real** será carregado automaticamente

### Para Emergência Silenciosa:

1. **Role até o final** da lista de receitas
2. **Encontre** a seção "⭐ Receitas Favoritas"
3. **Pressione e segure** o botão "Minhas Receitas Especiais" por 3 segundos
4. **A função de emergência** será ativada sem sair do modo disfarçado

### Para Desativar o Modo Disfarçado:

1. **Acesse o app real** usando o gesto secreto
2. **Navegue** para Configurações → Privacidade
3. **Desative** a opção "Modo Disfarçado"
4. **O app voltará** ao comportamento normal

## 🛡️ Aspectos de Segurança

### ✅ Privacidade

- **Armazenamento seguro** das configurações com SecureStore
- **Criptografia** dos dados de configuração
- **Sem vestígios** do app real na interface disfarçada

### ✅ Usabilidade

- **Interface convincente** que passa por um app real de receitas
- **Conteúdo realista** com receitas detalhadas
- **Funcionamento normal** de todas as funcionalidades disfarçadas
- **Feedback visual** adequado para não levantar suspeitas

### ✅ Emergência

- **Dupla funcionalidade**: acesso ao app real E ativação de emergência
- **Gesto discreto** que não levanta suspeitas
- **Botão de emergência** completamente disfarçado
- **Ativação silenciosa** sem alterar a interface

## 📱 Estrutura de Arquivos

```
app/
├── _layout.tsx                 # Navegação e redirecionamento
├── disguised-mode.tsx          # Interface do app de receitas
└── privacy.tsx                 # Configurações de privacidade

src/
├── components/ui/
│   └── SecretGestureDetector.tsx    # Detector de gestos secretos
├── context/
│   └── DisguisedModeContext.tsx     # Contexto global do modo
└── hooks/
    └── usePrivacySettings.ts        # Hook para configurações
```

## 🎨 Design e UX

### Interface Disfarçada

- **Tema** claro e acolhedor (cores quentes)
- **Ícones** relacionados à culinária
- **Tipografia** amigável e legível
- **Layout** típico de apps de receitas
- **Shadows e bordas** para depth visual

### Feedback Visual

- **Overlay** semi-transparente para confirmações
- **Ícones** intuitivos (escudo, coração, chef)
- **Cores** que transmitem segurança (verde para confirmação)
- **Animações** suaves para transições

## 🔍 Testando a Implementação

1. **Ative** o modo disfarçado nas configurações
2. **Verifique** se a interface de receitas aparece
3. **Teste** o gesto secreto (5 toques rápidos no título)
4. **Teste** o botão de emergência (pressionar e segurar por 3s)
5. **Navegue** pelas receitas para testar a autenticidade
6. **Desative** o modo e volte ao app normal

## 🚀 Status da Implementação

### ✅ Completado

- [x] Interface de configuração de privacidade
- [x] Hook para gerenciar configurações com persistência
- [x] Componente detector de gestos secretos
- [x] Interface completa do app de receitas disfarçado
- [x] Sistema de navegação e redirecionamento
- [x] Botão de emergência disfarçado
- [x] Feedback visual para ativações
- [x] Integração com contexto global
- [x] Documentação completa

### 🎯 Funcionalidade Principal

O **Modo Disfarçado** está 100% funcional e pronto para uso em produção. A implementação fornece uma camada adicional crítica de segurança para usuárias do Luva Branca que possam estar em situações de risco ou sob vigilância.

---

**⚠️ Importante**: Esta funcionalidade é destinada exclusivamente para situações de segurança real. Instrua as usuárias sobre como usar corretamente os gestos secretos em situações de emergência.

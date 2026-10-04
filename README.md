# PsiFinanças - Gestão Financeira Clínica

Sistema minimalista, prático e intuitivo de gestão financeira para psicoterapeutas, com controle de sessões, receitas recebidas/a receber, cadastro de pacientes, gráficos comparativos de períodos e salvamento automático na nuvem com o Google Cloud Firestore.

---

## 🚀 Como Rodar Localmente (a partir do GitHub)

1. Clone o repositório:
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O sistema estará rodando em `http://localhost:3000`.

---

## 🌐 Publicação no GitHub Pages (Sem Tela Branca)

O projeto já está configurado com `base: './'` no `vite.config.ts` e com um workflow automático do GitHub Actions:

1. Acesse o seu repositório no GitHub.
2. Vá em **Settings** > **Pages** (no menu lateral esquerdo).
3. Na seção **Build and deployment**:
   * Em **Source**, selecione **GitHub Actions**.
4. O GitHub executará o build automaticamente e fornecerá o link direto da sua aplicação (ex: `https://seu-usuario.github.io/seu-repositorio/`).

---

## ☁️ Banco de Dados e Nuvem
O sistema possui integração nativa com o **Google Cloud Firestore**, gravando todas as sessões e pacientes em tempo real. Se estiver sem conexão com a internet ou em modo offline, o sistema opera de forma resiliente com cache local sem interrupções.

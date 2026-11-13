# Sistema de Prospecção Ativa SKY B2B

Sistema web sob medida para consultores comerciais e gestores da **SKY B2B**, focado na prospecção, qualificação e agendamento de visitas presenciais em estabelecimentos de alto potencial:
1. **Hotéis, Pousadas, Resorts e Hostels** (CNAE 5510-8/01 - quartos, recepção e áreas sociais)
2. **Hospitais, Maternidades e Clínicas de Grande Porte** (CNAE 8610-1/01 - leitos de internação e salas de espera)
3. **Bares, Choperias e Grandes Restaurantes** (CNAE 5611-2/01 - múltiplos ambientes e telões esportivos)

---

## 🚀 Como Iniciar

Basta dar um duplo clique no arquivo:
```
iniciar.bat
```
Ou executar no terminal:
```bash
npm start
```
O sistema abrirá automaticamente no navegador em: **`http://localhost:3001`**

---

## 🔑 Acessos e Credenciais

### 1. Administrador Geral (Super Adm)
* **Usuário:** `Adm`
* **Senha:** `S@ulo160605`

> **Poderes do Adm:**
> * Visualiza todo o sistema e todas as carteiras;
> * Acessa a aba **"Gestão de Usuários"** para cadastrar novos vendedores, definir senhas e ativar/desativar contas;
> * Acessa a **"Visão Geral da Equipe"** com métricas completas de prospecção e ranking de vendedores;
> * Possui filtro de supervisor na carteira para auditar qualquer vendedor individualmente ou ver toda a base unificada.

### 2. Vendedor / Consultor Comercial
* Criado diretamente pelo Adm na aba **"Gestão de Usuários"**;
* Cada vendedor acessa **apenas a sua própria carteira de leads**, garantindo total privacidade e evitando duplicidades;
* Pode minerar leads, registrar ligações, disparar WhatsApp com pitch pronto, agendar visitas e exportar planilhas para Excel.
* *(Usuário de teste já criado para demonstração: login `lucas.sky` / senha `123456`)*.

---

## 🛠️ Principais Módulos

* **🔍 Gerador de Leads:** Selecione o Ramo, o Estado (todas as 27 UFs) e a Cidade. A lista surge na hora com telefones, WhatsApp, CNPJ, endereço completo e estimativa de telas/quartos. Com 1 clique, importe os selecionados para a sua carteira.
* **📋 Minha Carteira:** Gestão ativa com click-to-call, WhatsApp integrado com proposta comercial pré-escrita, links diretos para o Google Maps, botão de registrar ligações e histórico de notas.
* **📅 Visitas Agendadas:** Calendário e lista de compromissos presenciais marcados com data, hora, decisor e rotas no Maps.
* **👥 Gestão de Usuários (Exclusivo Adm):** Criação e controle de senhas de toda a equipe.
* **📊 Visão Geral Equipe (Exclusivo Adm):** Acompanhamento de metas e produtividade de cada vendedor.
* **📥 Exportação Excel (.xlsx):** Baixe relatórios completos a qualquer momento.

# Guia de Contribuição
Para garantir a organização e a clareza do histórico deste projeto, adotamos padrões específicos para a criação de branches e commits.
## 📌 Padronização
Este guia baseia-se na convenção [Convetional Commit](https://www.conventionalcommits.org/pt-br/v1.0.0/). As diretrizes aqui estipuladas aplicam-se à nomenclatura de commits e estendem-se à estrutura de branches.

---
## 💬 Nomenclatura de Commits
A estrutura base de um commit deve seguir o formato:

```bash
<tipo>(escopo): <descrição>
```
_Exemplo: `feat(cadastro): validação do número de whatsapp`_

1. **Tipo**
O tipo indica o contexto da alteração. Os principais são:
- **feat**: Nova funcionalidade.
- **fix**: Correção de bug.
- **refactor**: Alteração no código que não corrige um bug nem adiciona funcionalidade.
- **docs**: Alterações em documentações ou comentários.
Outros tipos comuns:
- **chore**: Mudanças que não afetam o código ou o usuário final (ex: `.gitignore`).
- **build**: Alterações no sistema de build ou dependências externas (ex: npm).
- **ci**: Arquivos e scripts de configuração de CI.
- **perf**: Melhorias de desempenho.
- **style**: Alterações visuais ou de formatação que não afetam a lógica (cores, alinhamento).
- **test**: Criação ou alteração de testes.

2. **Escopo(Opcional)**
Identifica a área do sistema afetada, facilitando a leitura rápida. Exemplos: `login`, `cadastro`, `tabela-transacoes`.

3. **Descrição**
É o corpo do commit. Deve conter uma frase curta e objetiva descrevendo o que foi realizado.

---
## 🌿 Estrutura de Branches
O repositório utiliza duas branches principais que possuem fluxo de CI/CD e deploy automatizado:
- **`main`**: Contém o código estável em produção.
- **`develop`**: Branch de integração e testes. Todo novo desenvolvimento deve ser integrado aqui antes de seguir para a `main`. É a base do ambiente de desenvolvimento.

>[!Warning]
Jamais faça push direto na main.
### Fluxo de Criação
Para contribuir, crie uma branch a partir da `develop`. A nomenclatura das branches segue uma lógica similar à dos commits, refletindo as tarefas (tasks) do Board de Projeto no GitHub para garantir rastreabilidade:

```bash
<tipo>/<numero-da-task>-<nome-da-task>
```
_Exemplo: `feat/114-ajustes-na-tela-de-cadastro`_

1. **Tipo**: Geralmente utiliza-se os tipos principais (`feat`, `fix`, `refactor`).
2. **Número da task**: ID correspondente no Board de Projeto.
3. **Nome da task**: Título da tarefa no Board de Projeto.

---
## 🤝 Padrões de Merge e Fluxo de Trabalho
O fluxo de integração segue a ordem: **`task` → `develop` → `main`**
### Como contribuir:
1. **Crie uma branch** a partir da `develop`.
2. **Realize seus commits** seguindo o padrão descrito neste documento.
3. **Abra um Pull Request (PR)** direcionado à branch `develop`.
4. **Descreva suas alterações** na PR para orientar o revisor.
5. **Solicite a revisão** do código.
6. **Realize o merge** após a aprovação (caso tenha permissão).
7. **Remova a branch** da task após a conclusão do merge.

>[!important]
> O merge da branch develop na main é feita pelo gerente do projeto.
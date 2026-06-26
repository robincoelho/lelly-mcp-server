# Lelly MCP Server 🚀

O **Lelly MCP Server** é uma implementação oficial do [Model Context Protocol (MCP)](https://modelcontextprotocol.io) desenvolvida para conectar a plataforma **Lelly.chat** a agentes de inteligência artificial de terminal ou editores de código (como Claude Code, Claude Desktop, Cursor, Copilot, etc.).

Com este servidor MCP, seu agente de IA pode gerenciar diretamente pelo terminal as suas listas de tarefas, programar lembretes (via WhatsApp, Email, Site ou Chat), pesquisar e alimentar a sua base de conhecimento de notas pessoais, registrar logs de diário de saúde (calorias, água, exercícios, sono) e gerenciar leads e clientes no CRM comercial.

---

## 🛠️ Funcionalidades e Ferramentas Expostas

O servidor MCP expõe as seguintes ferramentas utilitárias:

### 1. Organizador de Tarefas (`Tasks & Lists`)
* **`list_tasks_lists`**: Lista todas as pastas/listas de tarefas criadas.
* **`list_tasks`**: Exibe todas as tarefas (com status concluída/pendente, pomodoros planejados/completados e data limite), com filtro por lista.
* **`create_task_list`**: Cria uma nova lista/pasta organizadora.
* **`create_task`**: Adiciona uma nova tarefa dentro de uma lista com data de entrega opcional.
* **`toggle_task`**: Conclui ou reabre uma tarefa pendente.
* **`delete_task`**: Exclui permanentemente uma tarefa.

### 2. Agendamento de Lembretes (`Reminders`)
* **`list_reminders`**: Retorna todos os lembretes do usuário, com opção de filtrar por status (`pending`/`sent`).
* **`create_reminder`**: Agenda um novo lembrete com opção de escolher múltiplos canais de aviso (WhatsApp, E-mail, Alerta no Site e Alerta no Chat).
* **`delete_reminder`**: Cancela e exclui um lembrete agendado.

### 3. Diário de Saúde (`Health & Wellness`)
* **`get_health_log`**: Obtém o histórico completo de saúde de um determinado dia (calorias, água, sono, peso, exercícios realizados e refeições cadastradas).
* **`log_water`**: Adiciona consumo de água (ml) para o dia especificado.
* **`log_calories`**: Adiciona consumo calórico (kcal) para o dia especificado.
* **`log_meal`**: Cadastra uma refeição com descrição, calorias e horário (café da manhã, almoço, jantar, etc.).
* **`log_exercise`**: Cadastra um exercício físico com duração, intensidade, calorias queimadas e notas.
* **`update_health_log`**: Modifica métricas gerais como horas de sono, peso, humor e anotações do dia.

### 4. CRM Comercial (`Leads & Customers`)
* **`list_crm_customers`**: Lista clientes e leads cadastrados no CRM do Lelly com filtro de status.
* **`create_crm_customer`**: Cadastra um novo lead ou cliente com nome, e-mail, telefone, empresa e anotações comerciais.

### 5. Base de Conhecimento (`Knowledge Base`)
* **`search_knowledge`**: Pesquisa anotações ou artigos salvos na Base de Conhecimento do usuário.
* **`add_knowledge_item`**: Salva uma nova anotação ou artigo detalhado com título, corpo e tags personalizadas.

---

## ⚙️ Instalação e Configuração

### 1. Pré-requisitos
* Node.js (versão 18 ou superior) instalado localmente.

### 2. Configurando o Ambiente
Clone o repositório e crie um arquivo `.env` na raiz do projeto com as credenciais do banco de dados MySQL da sua instalação do Lelly:

```bash
# Clone o repositório
git clone git@github.com:robincoelho/lelly-mcp-server.git
cd lelly-mcp-server

# Instale as dependências
npm install
```

Crie o arquivo `.env`:
```env
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASS=sua_senha_mysql
DB_NAME=seu_banco_lelly
USER_ID=11 # ID do usuário no banco Lelly.chat (padrão é 11)
```

---

## 🔌 Integração com Clientes de IA

### 1. Claude Code (CLI)
Para carregar o servidor MCP no Claude Code, execute o comando especificando o caminho absoluto do servidor:
```bash
claude --mcp lelly=node,/caminho/absoluto/para/lelly-mcp-server/index.js
```
*Substitua `/caminho/absoluto/para/` pelo diretório real em que o projeto foi clonado.*

### 2. Claude Desktop
Abra o arquivo de configuração do seu Claude Desktop (geralmente em `~/Library/Application Support/Claude/claude_desktop_config.json` no Mac ou `%APPDATA%\Claude\claude_desktop_config.json` no Windows) e adicione o Lelly MCP na chave `mcpServers`:

```json
{
  "mcpServers": {
    "lelly": {
      "command": "node",
      "args": ["/caminho/absoluto/para/lelly-mcp-server/index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_USER": "seu_usuario_mysql",
        "DB_PASS": "sua_senha_mysql",
        "DB_NAME": "seu_banco_lelly",
        "USER_ID": "11"
      }
    }
  }
}
```

### 3. Cursor
1. Abra as **Configurações** do Cursor (`Cursor Settings` -> `Features` -> `MCP`).
2. Clique em **+ Add New MCP Server**.
3. Configure:
   * **Name:** `Lelly`
   * **Type:** `stdio`
   * **Command:** `node /caminho/absoluto/para/lelly-mcp-server/index.js`
4. Clique em **Save**.

---

## 🔒 Licença

Este projeto está licenciado sob a licença MIT - consulte o arquivo [LICENSE](LICENSE) para obter detalhes.

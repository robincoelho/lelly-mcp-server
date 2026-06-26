# Lelly MCP Server 🚀

**Lelly MCP Server** is the official implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) built to connect the **Lelly.chat** workspace with AI agents and coding tools (such as Claude Code, Claude Desktop, Cursor, and more).

This integration empowers your AI assistants to interact directly with your tasks, scheduled reminders (delivered via WhatsApp, Email, Site, or Chat), health tracking journals (water, calories, exercise, sleep), CRM pipeline, personal finance ledger, spiritual devotionals, and personalized knowledge base — bringing your organizational workspace straight to your terminal and code editor.

---

## 🛠️ Exposed Tools & Features

The MCP server exposes a rich set of database-driven tools for your AI agents:

### 1. Task Organizer (`Tasks & Lists`)
* **`list_tasks_lists`**: Fetch all task lists/folders in your Lelly organizer.
* **`list_tasks`**: Retrieve list items (includes task content, status, planned/completed Pomodoros, and due dates), with optional list filtering.
* **`create_task_list`**: Create a new task list/folder.
* **`create_task`**: Add a new task to a specific list with an optional due date.
* **`toggle_task`**: Mark a task as completed or reopen a finished one.
* **`delete_task`**: Permanently remove a task from a list.

### 2. Reminders Scheduling (`Reminders`)
* **`list_reminders`**: Retrieve scheduled reminders, with optional status filtering (`pending`/`sent`).
* **`create_reminder`**: Schedule a reminder with custom delivery channels (WhatsApp, Email, On-Site Notification, and Chatbot Alert).
* **`delete_reminder`**: Cancel and delete a scheduled reminder.

### 3. Health & Wellness Tracker (`Health & Wellness`)
* **`get_health_log`**: Fetch the complete health dashboard log of a day (water, sleep, calories, weight, mood, notes, meals, and exercises).
* **`log_water`**: Record or add water intake (ml) for a specific date.
* **`log_calories`**: Record or add calorie consumption (kcal) for a specific date.
* **`log_meal`**: Log a meal with a description, calories, and time (breakfast, lunch, dinner, etc.).
* **`log_exercise`**: Log physical activity with duration, intensity, calories burned, and notes.
* **`update_health_log`**: Modify general daily metrics like sleep hours, weight, mood rating, and daily notes.

### 4. CRM Commercial Pipeline (`Leads & Customers`)
* **`list_crm_customers`**: Fetch leads and customers registered in Lelly's CRM, with status filtering.
* **`create_crm_customer`**: Register a new lead or customer with contact details (name, email, phone, company) and notes.

### 5. Knowledge Base (`Knowledge Base`)
* **`search_knowledge`**: Search through articles or notes stored in your Lelly Knowledge Base.
* **`add_knowledge_item`**: Save a new article, note, or code snippet with a title, body, and custom tags.

### 6. Personal Finance Ledger (`Finance`)
* **`list_finance_accounts`**: List active accounts (banks, wallets, investments) with their respective balances.
* **`list_finance_categories`**: Fetch your category list for budgeting (income, expense, transfer).
* **`list_transactions`**: Retrieve recent transactions, optionally filtered by account.
* **`create_transaction`**: Record a new transaction (income, expense, or transfer) and automatically adjust the associated account balances within a database transaction.
* **`get_finance_summary`**: Get a quick financial summary including total active balance, historical incomes/expenses, and net cash flow.

### 7. Spiritual Journal & Devotionals (`Spiritual Life`)
* **`list_devotionals`**: Fetch recent scripture reflections and devocionais log.
* **`create_devotional`**: Log a new devotional page (bible verse, verse text, reflection, and life application).
* **`list_prayers`**: Retrieve active, answered, or archived prayer requests.
* **`create_prayer_request`**: Record a new prayer request with an optional category.
* **`answer_prayer`**: Mark a prayer request as answered and record notes of thanks.
* **`list_spiritual_journal`**: Fetch spiritual diary notes.
* **`create_journal_entry`**: Add an entry page to your spiritual journal with emotional/spiritual mood states and tags.

---

## ⚙️ Operating Modes & Configuration

Lelly MCP Server can run in two different modes depending on your setup:

### 1. Cloud Mode (SaaS - Recommended)
If you are using the official hosted platform at **Lelly.chat**, you do not need to expose your database. The server will securely forward your tool requests to Lelly's secure public endpoint using a Developer API Key.

To enable **Cloud Mode**, configure the following environment variables:
```env
LELLY_API_URL=https://lelly.chat
LELLY_API_KEY=sk_live_your_api_key_here
```
*(You can generate your Developer API Key inside your dashboard settings on Lelly.chat).*

### 2. Local Mode (Self-Hosted)
If you run a self-hosted instance of Lelly or prefer to connect directly to your local MySQL database, configure your local database credentials instead:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_NAME=your_lelly_database
USER_ID=11 # The user ID on your local Lelly database (defaults to 11)
```

---

## 🚀 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:robincoelho/lelly-mcp-server.git
   cd lelly-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root folder and configure it using either **Cloud Mode** or **Local Mode** variables as described above.

---

## 🔌 Connecting to AI Clients

### 1. Claude Code (CLI)
Start Claude Code and load the Lelly MCP server by providing the absolute path to `index.js`:
```bash
claude --mcp lelly=node,/absolute/path/to/lelly-mcp-server/index.js
```
*(Make sure to replace `/absolute/path/to/` with your project's actual local folder path).*

### 2. Claude Desktop
Open your Claude Desktop configuration file:
* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the server to `mcpServers` using your preferred mode:

**Example (Cloud Mode):**
```json
{
  "mcpServers": {
    "lelly": {
      "command": "node",
      "args": ["/absolute/path/to/lelly-mcp-server/index.js"],
      "env": {
        "LELLY_API_URL": "https://lelly.chat",
        "LELLY_API_KEY": "sk_live_your_api_key_here"
      }
    }
  }
}
```

**Example (Local Mode):**
```json
{
  "mcpServers": {
    "lelly": {
      "command": "node",
      "args": ["/absolute/path/to/lelly-mcp-server/index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_USER": "your_mysql_user",
        "DB_PASS": "your_mysql_password",
        "DB_NAME": "your_lelly_database",
        "USER_ID": "11"
      }
    }
  }
}
```

### 3. Cursor
1. Go to **Cursor Settings** -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the configuration:
   * **Name:** `Lelly`
   * **Type:** `stdio`
   * **Command:** `node /absolute/path/to/lelly-mcp-server/index.js`
4. Click **Save**.
*(If you run Cursor, make sure to define the environment variables in a global `.env` file in the `lelly-mcp-server` directory).*

---

## 🔒 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

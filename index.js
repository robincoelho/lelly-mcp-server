#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/shared/protocols.js";
import db from "./db.js";

// ID do usuário padrão (pode ser configurado via variável de ambiente, padrão 11 para Robin)
const USER_ID = process.env.USER_ID ? parseInt(process.env.USER_ID, 10) : 11;

console.error(`[Lelly MCP] Inicializando para o USER_ID: ${USER_ID}`);

const server = new Server(
  {
    name: "lelly-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Auxiliar para formatar datas no padrão MySQL
function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return d.toISOString().split("T")[0];
}

// 1. DECLARAÇÃO DAS FERRAMENTAS (Tools)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // === TAREFAS E LISTAS ===
      {
        name: "list_tasks_lists",
        description: "Lista todas as pastas/listas de tarefas no organizador de produtividade do Lelly.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "list_tasks",
        description: "Lista as tarefas de uma lista específica ou todas as tarefas do usuário.",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "number", description: "ID opcional da lista para filtrar as tarefas." }
          }
        }
      },
      {
        name: "create_task_list",
        description: "Cria uma nova lista/pasta de tarefas no organizador.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nome da nova lista." }
          },
          required: ["name"]
        }
      },
      {
        name: "create_task",
        description: "Cria uma nova tarefa dentro de uma lista específica.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Descrição ou conteúdo da tarefa." },
            list_id: { type: "number", description: "ID da lista onde a tarefa será adicionada." },
            due_at: { type: "string", description: "Data de entrega opcional (formato YYYY-MM-DD HH:MM:SS)." }
          },
          required: ["content", "list_id"]
        }
      },
      {
        name: "toggle_task",
        description: "Marca uma tarefa como concluída ou reabre uma concluída.",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "number", description: "ID da tarefa a ser alterada." }
          },
          required: ["task_id"]
        }
      },
      {
        name: "delete_task",
        description: "Exclui permanentemente uma tarefa.",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "number", description: "ID da tarefa a ser excluída." }
          },
          required: ["task_id"]
        }
      },

      // === LEMBRETES ===
      {
        name: "list_reminders",
        description: "Lista os lembretes pendentes ou enviados.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["pending", "sent"], description: "Status do lembrete." }
          }
        }
      },
      {
        name: "create_reminder",
        description: "Agenda um novo lembrete com canais de envio de notificação.",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string", description: "Mensagem do lembrete." },
            reminder_time: { type: "string", description: "Data e hora para envio (formato YYYY-MM-DD HH:MM:SS)." },
            notify_whatsapp: { type: "boolean", default: true },
            notify_email: { type: "boolean", default: false },
            notify_site: { type: "boolean", default: true },
            notify_chat: { type: "boolean", default: true }
          },
          required: ["message", "reminder_time"]
        }
      },
      {
        name: "delete_reminder",
        description: "Exclui um lembrete agendado.",
        inputSchema: {
          type: "object",
          properties: {
            reminder_id: { type: "number", description: "ID do lembrete a ser excluído." }
          },
          required: ["reminder_id"]
        }
      },

      // === DIÁRIO DE SAÚDE ===
      {
        name: "get_health_log",
        description: "Busca o histórico de saúde completo para uma data (calorias, água, exercícios, sono, peso, humor, notas e refeições).",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Data opcional (formato YYYY-MM-DD). Padrão é a data atual." }
          }
        }
      },
      {
        name: "log_water",
        description: "Registra ou adiciona água (ml) consumida em uma determinada data.",
        inputSchema: {
          type: "object",
          properties: {
            ml: { type: "number", description: "Quantidade de água em mililitros." },
            date: { type: "string", description: "Data opcional (formato YYYY-MM-DD). Padrão é hoje." }
          },
          required: ["ml"]
        }
      },
      {
        name: "log_calories",
        description: "Registra ou adiciona calorias (kcal) consumidas em uma determinada data.",
        inputSchema: {
          type: "object",
          properties: {
            kcal: { type: "number", description: "Quantidade de calorias em kcal." },
            date: { type: "string", description: "Data opcional (formato YYYY-MM-DD). Padrão é hoje." }
          },
          required: ["kcal"]
        }
      },
      {
        name: "log_meal",
        description: "Registra uma refeição consumida no diário de saúde.",
        inputSchema: {
          type: "object",
          properties: {
            meal_type: { type: "string", enum: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "supper"], description: "Tipo da refeição." },
            description: { type: "string", description: "Descrição do que foi comido." },
            calories: { type: "number", description: "Calorias da refeição (opcional)." },
            time: { type: "string", description: "Horário opcional (HH:MM)." },
            date: { type: "string", description: "Data opcional (YYYY-MM-DD). Padrão é hoje." }
          },
          required: ["meal_type", "description"]
        }
      },
      {
        name: "log_exercise",
        description: "Registra uma atividade física realizada.",
        inputSchema: {
          type: "object",
          properties: {
            exercise_type: { type: "string", description: "Tipo de exercício (Ex: Corrida, Musculação)." },
            duration_minutes: { type: "number", description: "Duração do exercício em minutos." },
            intensity: { type: "string", enum: ["light", "moderate", "intense"], default: "moderate" },
            calories_burned: { type: "number", description: "Calorias queimadas aproximadas." },
            notes: { type: "string", description: "Notas adicionais." },
            time: { type: "string", description: "Horário (HH:MM)." },
            date: { type: "string", description: "Data (YYYY-MM-DD). Padrão é hoje." }
          },
          required: ["exercise_type", "duration_minutes"]
        }
      },
      {
        name: "update_health_log",
        description: "Atualiza ou define métricas gerais de saúde de uma vez (como horas de sono, peso, humor e notas).",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Data (YYYY-MM-DD). Padrão é hoje." },
            sleep_hours: { type: "number", description: "Horas de sono." },
            weight_kg: { type: "number", description: "Peso atual em kg." },
            mood: { type: "number", minimum: 1, maximum: 5, description: "Humor (1 = Péssimo, 5 = Ótimo)." },
            notes: { type: "string", description: "Notas/diário mental do dia." }
          }
        }
      },

      // === CRM / CLIENTES ===
      {
        name: "list_crm_customers",
        description: "Lista clientes e leads cadastrados no CRM do Lelly.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["lead", "active", "inactive"], description: "Filtrar por status." }
          }
        }
      },
      {
        name: "create_crm_customer",
        description: "Cadastra um novo cliente ou lead no CRM.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nome do cliente/lead." },
            email: { type: "string", description: "E-mail do cliente." },
            phone: { type: "string", description: "Telefone de contato." },
            company: { type: "string", description: "Empresa." },
            notes: { type: "string", description: "Observações comerciais." },
            status: { type: "string", enum: ["lead", "active", "inactive"], default: "lead" }
          },
          required: ["name"]
        }
      },

      // === BASE DE CONHECIMENTO ===
      {
        name: "search_knowledge",
        description: "Pesquisa na base de conhecimento ou anotações pessoais do Lelly.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Termo de busca para título ou corpo da nota." }
          },
          required: ["query"]
        }
      },
      {
        name: "add_knowledge_item",
        description: "Adiciona uma nova anotação ou artigo à base de conhecimento.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título da nota." },
            body: { type: "string", description: "Conteúdo descritivo detalhado." },
            tags: { type: "string", description: "Tags associadas separadas por vírgula (ex: 'tecnologia, mcp')." }
          },
          required: ["title", "body"]
        }
      }
    ]
  };
});

// 2. TRATAMENTO DA EXECUÇÃO DAS FERRAMENTAS (Call Tool)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`[Lelly MCP] Chamando ferramenta: ${name} com args:`, args);

  try {
    switch (name) {
      // === TAREFAS E LISTAS ===
      case "list_tasks_lists": {
        const [rows] = await db.query(
          "SELECT id, name FROM lists WHERE user_id = ?",
          [USER_ID]
        );
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      case "list_tasks": {
        let query = "SELECT li.id, li.list_id, l.name as list_name, li.content, li.is_done, li.due_at, li.completed_pomodoros, li.planned_pomodoros FROM list_items li JOIN lists l ON li.list_id = l.id WHERE l.user_id = ?";
        const params = [USER_ID];

        if (args.list_id) {
          query += " AND li.list_id = ?";
          params.push(args.list_id);
        }

        const [rows] = await db.query(query, params);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      case "create_task_list": {
        const [result] = await db.query(
          "INSERT INTO lists (user_id, name) VALUES (?, ?)",
          [USER_ID, args.name]
        );
        return { content: [{ type: "text", text: `Lista de tarefas '${args.name}' criada com sucesso! ID: ${result.insertId}` }] };
      }

      case "create_task": {
        // Valida propriedade da lista
        const [listOwner] = await db.query("SELECT id FROM lists WHERE id = ? AND user_id = ?", [args.list_id, USER_ID]);
        if (listOwner.length === 0) {
          throw new Error(`Lista ID ${args.list_id} não pertence ao usuário.`);
        }

        const dueAt = args.due_at || null;
        const [result] = await db.query(
          "INSERT INTO list_items (list_id, content, due_at) VALUES (?, ?, ?)",
          [args.list_id, args.content, dueAt]
        );
        return { content: [{ type: "text", text: `Tarefa criada com sucesso! ID: ${result.insertId}` }] };
      }

      case "toggle_task": {
        // Valida propriedade da tarefa
        const [taskOwner] = await db.query(
          "SELECT li.id, li.is_done FROM list_items li JOIN lists l ON li.list_id = l.id WHERE li.id = ? AND l.user_id = ?",
          [args.task_id, USER_ID]
        );
        if (taskOwner.length === 0) {
          throw new Error(`Tarefa ID ${args.task_id} não pertence ao usuário.`);
        }

        const nextStatus = taskOwner[0].is_done ? 0 : 1;
        await db.query(
          "UPDATE list_items SET is_done = ? WHERE id = ?",
          [nextStatus, args.task_id]
        );
        return { content: [{ type: "text", text: `Tarefa ID ${args.task_id} atualizada para status: ${nextStatus === 1 ? 'Concluída' : 'Pendente'}` }] };
      }

      case "delete_task": {
        // Valida propriedade da tarefa
        const [taskOwner] = await db.query(
          "SELECT li.id FROM list_items li JOIN lists l ON li.list_id = l.id WHERE li.id = ? AND l.user_id = ?",
          [args.task_id, USER_ID]
        );
        if (taskOwner.length === 0) {
          throw new Error(`Tarefa ID ${args.task_id} não pertence ao usuário.`);
        }

        await db.query("DELETE FROM list_items WHERE id = ?", [args.task_id]);
        return { content: [{ type: "text", text: `Tarefa ID ${args.task_id} excluída com sucesso.` }] };
      }

      // === LEMBRETES ===
      case "list_reminders": {
        let query = "SELECT id, reminder_message, reminder_time, status, notify_whatsapp, notify_email, notify_site, notify_chat FROM reminders WHERE user_id = ?";
        const params = [USER_ID];

        if (args.status) {
          query += " AND status = ?";
          params.push(args.status);
        }

        const [rows] = await db.query(query, params);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      case "create_reminder": {
        const notifyWhatsapp = args.notify_whatsapp !== false ? 1 : 0;
        const notifyEmail = args.notify_email === true ? 1 : 0;
        const notifySite = args.notify_site !== false ? 1 : 0;
        const notifyChat = args.notify_chat !== false ? 1 : 0;

        const [result] = await db.query(
          "INSERT INTO reminders (user_id, reminder_message, reminder_time, status, notify_whatsapp, notify_email, notify_site, notify_chat) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)",
          [USER_ID, args.message, args.reminder_time, notifyWhatsapp, notifyEmail, notifySite, notifyChat]
        );
        return { content: [{ type: "text", text: `Lembrete agendado com sucesso! ID: ${result.insertId}` }] };
      }

      case "delete_reminder": {
        const [result] = await db.query(
          "DELETE FROM reminders WHERE id = ? AND user_id = ?",
          [args.reminder_id, USER_ID]
        );
        if (result.affectedRows === 0) {
          throw new Error(`Lembrete ID ${args.reminder_id} não encontrado ou não pertence a este usuário.`);
        }
        return { content: [{ type: "text", text: `Lembrete ID ${args.reminder_id} excluído com sucesso.` }] };
      }

      // === DIÁRIO DE SAÚDE ===
      case "get_health_log": {
        const targetDate = args.date || getTodayDateString();
        const [logs] = await db.query("SELECT * FROM health_logs WHERE user_id = ? AND log_date = ?", [USER_ID, targetDate]);
        const [meals] = await db.query("SELECT * FROM health_meals WHERE user_id = ? AND log_date = ?", [USER_ID, targetDate]);
        const [exercises] = await db.query("SELECT * FROM health_exercises WHERE user_id = ? AND log_date = ?", [USER_ID, targetDate]);

        const fullLog = {
          date: targetDate,
          metrics: logs[0] || null,
          meals: meals,
          exercises: exercises
        };

        return { content: [{ type: "text", text: JSON.stringify(fullLog, null, 2) }] };
      }

      case "log_water": {
        const targetDate = args.date || getTodayDateString();
        const [logs] = await db.query("SELECT id, water_ml FROM health_logs WHERE user_id = ? AND log_date = ?", [USER_ID, targetDate]);

        if (logs.length === 0) {
          await db.query(
            "INSERT INTO health_logs (user_id, log_date, water_ml) VALUES (?, ?, ?)",
            [USER_ID, targetDate, args.ml]
          );
        } else {
          const currentWater = logs[0].water_ml || 0;
          await db.query(
            "UPDATE health_logs SET water_ml = ? WHERE id = ?",
            [currentWater + args.ml, logs[0].id]
          );
        }
        return { content: [{ type: "text", text: `Consumo de ${args.ml}ml de água registrado para ${targetDate}!` }] };
      }

      case "log_calories": {
        const targetDate = args.date || getTodayDateString();
        const [logs] = await db.query("SELECT id, calories FROM health_logs WHERE user_id = ? AND log_date = ?", [USER_ID, targetDate]);

        if (logs.length === 0) {
          await db.query(
            "INSERT INTO health_logs (user_id, log_date, calories) VALUES (?, ?, ?)",
            [USER_ID, targetDate, args.kcal]
          );
        } else {
          const currentCalories = logs[0].calories || 0;
          await db.query(
            "UPDATE health_logs SET calories = ? WHERE id = ?",
            [currentCalories + args.kcal, logs[0].id]
          );
        }
        return { content: [{ type: "text", text: `Consumo de ${args.kcal}kcal registrado para ${targetDate}!` }] };
      }

      case "log_meal": {
        const targetDate = args.date || getTodayDateString();
        const cal = args.calories || null;
        const time = args.time || null;

        await db.query(
          "INSERT INTO health_meals (user_id, log_date, meal_type, description, calories, time) VALUES (?, ?, ?, ?, ?, ?)",
          [USER_ID, targetDate, args.meal_type, args.description, cal, time]
        );
        return { content: [{ type: "text", text: `Refeição '${args.description}' do tipo '${args.meal_type}' registrada para ${targetDate}!` }] };
      }

      case "log_exercise": {
        const targetDate = args.date || getTodayDateString();
        const cal = args.calories_burned || null;
        const notes = args.notes || null;
        const time = args.time || null;

        await db.query(
          "INSERT INTO health_exercises (user_id, log_date, exercise_type, duration_minutes, intensity, calories_burned, notes, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [USER_ID, targetDate, args.exercise_type, args.duration_minutes, args.intensity, cal, notes, time]
        );
        return { content: [{ type: "text", text: `Exercício '${args.exercise_type}' de ${args.duration_minutes} min registrado para ${targetDate}!` }] };
      }

      case "update_health_log": {
        const targetDate = args.date || getTodayDateString();
        const [logs] = await db.query("SELECT id FROM health_logs WHERE user_id = ? AND log_date = ?", [USER_ID, targetDate]);

        if (logs.length === 0) {
          const sleep = args.sleep_hours || null;
          const weight = args.weight_kg || null;
          const mood = args.mood || null;
          const notes = args.notes || null;

          await db.query(
            "INSERT INTO health_logs (user_id, log_date, sleep_hours, weight_kg, mood, notes) VALUES (?, ?, ?, ?, ?, ?)",
            [USER_ID, targetDate, sleep, weight, mood, notes]
          );
        } else {
          const updates = [];
          const params = [];

          if (args.sleep_hours !== undefined) { updates.push("sleep_hours = ?"); params.push(args.sleep_hours); }
          if (args.weight_kg !== undefined) { updates.push("weight_kg = ?"); params.push(args.weight_kg); }
          if (args.mood !== undefined) { updates.push("mood = ?"); params.push(args.mood); }
          if (args.notes !== undefined) { updates.push("notes = ?"); params.push(args.notes); }

          if (updates.length > 0) {
            params.push(logs[0].id);
            await db.query(`UPDATE health_logs SET ${updates.join(", ")} WHERE id = ?`, params);
          }
        }
        return { content: [{ type: "text", text: `Métricas de saúde atualizadas com sucesso para ${targetDate}!` }] };
      }

      // === CRM ===
      case "list_crm_customers": {
        let query = "SELECT id, name, email, phone, company, notes, status FROM crm_customers WHERE user_id = ?";
        const params = [USER_ID];

        if (args.status) {
          query += " AND status = ?";
          params.push(args.status);
        }

        const [rows] = await db.query(query, params);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      case "create_crm_customer": {
        const email = args.email || null;
        const phone = args.phone || null;
        const company = args.company || null;
        const notes = args.notes || null;
        const status = args.status || "lead";

        const [result] = await db.query(
          "INSERT INTO crm_customers (user_id, name, email, phone, company, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [USER_ID, args.name, email, phone, company, notes, status]
        );
        return { content: [{ type: "text", text: `Cliente/Lead '${args.name}' cadastrado no CRM! ID: ${result.insertId}` }] };
      }

      // === BASE DE CONHECIMENTO ===
      case "search_knowledge": {
        const queryTerm = `%${args.query}%`;
        const [rows] = await db.query(
          "SELECT id, title, body, tags, created_at FROM user_knowledge WHERE user_id = ? AND enabled = 1 AND (title LIKE ? OR body LIKE ?)",
          [USER_ID, queryTerm, queryTerm]
        );
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      case "add_knowledge_item": {
        const tags = args.tags || null;
        const [result] = await db.query(
          "INSERT INTO user_knowledge (user_id, title, body, tags, enabled) VALUES (?, ?, ?, ?, 1)",
          [USER_ID, args.title, args.body, tags]
        );
        return { content: [{ type: "text", text: `Artigo/Nota '${args.title}' adicionada com sucesso à Base de Conhecimento! ID: ${result.insertId}` }] };
      }

      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  } catch (error) {
    console.error(`[Lelly MCP] Erro ao executar ${name}:`, error);
    return {
      content: [{ type: "text", text: `Erro: ${error.message}` }],
      isError: true,
    };
  }
});

// 3. INICIALIZAÇÃO DO TRANSPORTE STDIO
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[Lelly MCP] Servidor MCP rodando e conectado via Stdio.");
}

run().catch((error) => {
  console.error("[Lelly MCP] Erro fatal durante a execução:", error);
  process.exit(1);
});

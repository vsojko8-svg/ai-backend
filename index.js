import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/*
  Хранилище диалогов
  В продакшене лучше использовать Redis или БД,
  но для старта этого достаточно.
*/
const sessions = {};

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Нет сообщения" });
    }

    const id = sessionId || "default";

    if (!sessions[id]) {
      sessions[id] = [];
    }

    const systemPrompt = `
Ты AI-ассистент, который продаёт AI-чат для бизнеса.

Продукт:
- Работает 24/7
- Увеличивает заявки на 20–40%
- Подключение за 1–2 дня
- Подходит для цветочных магазинов, салонов красоты, интернет-магазинов
-Стоит 2500 рублей в месяц

Правила:
- Отвечай кратко и понятно
- Без сложных терминов
- Делай акцент на выгоде
- Если человек сомневается — объясняй простыми словами
- В конце мягко предлагай бесплатный тест
`;

    sessions[id].push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...sessions[id]
      ],
      temperature: 0.6
    });

    const reply = completion.choices[0].message.content;

    sessions[id].push({ role: "assistant", content: reply });

    // Ограничиваем историю
    if (sessions[id].length > 12) {
      sessions[id] = sessions[id].slice(-12);
    }

    res.json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/", (req, res) => {
  res.send("AI backend is running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

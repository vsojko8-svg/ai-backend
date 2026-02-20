import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `
Ты — профессиональный AI-ассистент приёмной комиссии университета.

Твоя задача:
- Отвечать чётко и структурированно
- Не выдумывать информацию
- Если данных недостаточно — задавать уточняющие вопросы
- Не рекомендовать одну и ту же специальность всем
- Анализировать интересы абитуриента

Если пользователь не знает, что выбрать:
1. Сначала задай 3 уточняющих вопроса
2. Затем предложи 2-3 направления с объяснением

Отвечай понятно, без воды.
`
        },
        ...history,
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

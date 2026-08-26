import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// API endpoint for deep AI Backgammon Coach Analysis
app.post("/api/coach/analyze-move", async (req, res) => {
  try {
    const { boardState, dice, moveMade, isWhiteTurn, pipCounts } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Return structured fallback analysis when no API key is provided
      return res.json({
        success: true,
        isAiGenerated: false,
        summary: "Аналіз виконано евристичним рушієм нард.",
        advice: "Тримайте зв'язок між шашками, прагніть займати ключові пункти (5-й, 7-й, 20-й) та мінімізуйте прямі удари з відстані 1-6 пунктів.",
      });
    }

    const prompt = `Ти — гросмейстер і професійний тренер з гри у короткі нарди (Backgammon). Твоє завдання — пояснити хід гравця українською мовою з точки зору стратегії та теорії ймовірностей.

Контекст партії:
- Хід гравця: ${isWhiteTurn ? "Білі (Гравець)" : "Чорні (Комп'ютер)"}
- Кидок кубиків: [${dice?.join(", ")}]
- Виконаний хід: ${JSON.stringify(moveMade)}
- Піп-каунт (Pip count): Білі=${pipCounts?.white}, Чорні=${pipCounts?.black} (Різниця: ${(pipCounts?.white ?? 0) - (pipCounts?.black ?? 0)})
- Короткий опис стану дошки: ${JSON.stringify(boardState?.slice(0, 26))}

Дай коротку, але глибоку оцінку українською мовою:
1. Чи був цей хід сильним або ризикованим?
2. Які стратегічні фактори зіграли роль (безпека блотів, побудова прайму, контроль анкерів, темп гонки)?
3. Наведи пораду на наступні ходи.
Відповідай структуровано, лаконічно (до 150 слів), дружнім тоном наставника.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Ти професійний українськомовний тренер з класичних коротких нард. Пояснюй стратегію, ймовірності та тактику зрозуміло, цікаво та експертно.",
      },
    });

    res.json({
      success: true,
      isAiGenerated: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error("Gemini coach analyze error:", error);
    res.json({
      success: false,
      error: error?.message || "Помилка аналізу ШІ",
      fallback: "Звертайте увагу на безпеку блотів та будуйте прайми для блокади суперника.",
    });
  }
});

// API endpoint for conversational AI Coach Q&A
app.post("/api/coach/ask", async (req, res) => {
  try {
    const { question, gameContext } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        isAiGenerated: false,
        answer: "Для персоналізованих відповідей ШІ потрібен GEMINI_API_KEY. Проте ось базове правило: в коротких нардах найважливішими є 5-й пункт (Золотий пункт), побудова прайму з 6 пунктів та контроль піп-каунту в гонці!",
      });
    }

    const prompt = `Користувач навчається грати в нарди і задає запитання тренеру:
"${question}"

Поточний стан гри (якщо є): ${JSON.stringify(gameContext || {})}

Дай чітку, практичну і навчальну відповідь українською мовою. Використовуй правильну термінологію нард (блоти, прайм, анкер, дім, бар, піп-каунт, викидання фішок, дубль). Поясни також ймовірнісний аспект за потреби.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Ти доброзичливий, досвідчений тренер з нард, який навчає початківців та гравців середнього рівня українською мовою.",
      },
    });

    res.json({
      success: true,
      isAiGenerated: true,
      answer: response.text,
    });
  } catch (error: any) {
    console.error("Gemini coach ask error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Не вдалося отримати відповідь від ШІ",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backgammon Coach Server running on http://localhost:${PORT}`);
  });
}

startServer();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Токен вашего бота
const botToken = "7718441618:AAEQ_e2NSf8LuMvfkn9twSYjnLSHlMVk7wk";
const bot = new TelegramBot(botToken);

// Моковые данные для валют и криптовалют
const currencies = {
  USD: 75.4,
  EUR: 89.7,
  GBP: 102.5,
};

const cryptos = {
  BTC: 45000,
  ETH: 3500,
  XRP: 0.6,
};

// Устанавливаем Webhook
const webhookUrl = "https://webhook.site/e58b98ec-0cf0-46ea-87cf-ee68deadcdcc";
bot.setWebHook(`${webhookUrl}/bot${botToken}`);

// Обработка /start команды
bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  bot.sendMessage(chatId, `Привет, ${username}! Выберите опцию:`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Валюта", callback_data: "currency" }],
        [{ text: "Криптовалюта", callback_data: "crypto" }],
        [{ text: "Калькулятор", callback_data: "calculator" }],
      ],
    },
  });
});

// Обработка выбора валют, криптовалют и калькулятора
bot.on("callback_query", callbackQuery => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data === "currency") {
    let currencyData = "Актуальные курсы валют:\n";
    for (let [key, value] of Object.entries(currencies)) {
      currencyData += `${key}: ${value} руб.\n`;
    }
    bot.sendMessage(chatId, currencyData);
  }

  if (callbackQuery.data === "crypto") {
    let cryptoData = "Актуальные курсы криптовалют:\n";
    for (let [key, value] of Object.entries(cryptos)) {
      cryptoData += `${key}: $${value}\n`;
    }
    bot.sendMessage(chatId, cryptoData);
  }

  if (callbackQuery.data === "calculator") {
    bot.sendMessage(chatId, "Выберите валюту для пересчета:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "USD", callback_data: "calc_usd" }],
          [{ text: "EUR", callback_data: "calc_eur" }],
        ],
      },
    });
  }
});

// Обработка калькулятора
bot.on("callback_query", callbackQuery => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data.startsWith("calc_")) {
    const currencyCode = callbackQuery.data.split("_")[1].toUpperCase();
    const currencyRate = currencies[currencyCode];

    bot.sendMessage(
      chatId,
      `Введите сумму в ${currencyCode} для пересчета в BTC:`
    );
    bot.once("message", msg => {
      const amount = parseFloat(msg.text);
      if (!isNaN(amount)) {
        const btcValue = (amount / currencyRate) * cryptos.BTC;
        bot.sendMessage(
          chatId,
          `Сумма ${amount} ${currencyCode} = ${btcValue.toFixed(8)} BTC`
        );
      } else {
        bot.sendMessage(chatId, "Пожалуйста, введите корректную сумму.");
      }
    });
  }
});

// Middleware для обработки данных от Telegram через Webhook
app.use(bodyParser.json());
app.post(`/bot${botToken}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Запуск сервера
app.get("/", (req, res) => {
  res.send("Бот работает с Webhook!");
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});

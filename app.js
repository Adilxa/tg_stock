const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Токен вашего бота
const botToken = "7718441618:AAEQ_e2NSf8LuMvfkn9twSYjnLSHlMVk7wk";
const bot = new TelegramBot(botToken);

// Моковые данные для валют, криптовалют и акций
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

// Данные по акциям для разных стран
const stocks = {
  USA: {
    AAPL: 150,
    TSLA: 700,
    GOOGL: 2800,
  },
  UK: {
    AAPL: 1500,
    TSLA: 720,
    GOOGL: 2200,
  },
  Japan: {
    AAPL: 130,
    TSLA: 790,
    GOOGL: 2100,
  },
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
        [{ text: "Курс акций", callback_data: "stocks" }],
        [{ text: "Калькулятор", callback_data: "calculator" }],
      ],
    },
  });
});

// Обработка выбора валют, криптовалют, акций и калькулятора
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

  if (callbackQuery.data === "stocks") {
    bot.sendMessage(chatId, "Выберите страну для просмотра курсов акций:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "США", callback_data: "stocks_usa" }],
          [{ text: "Великобритания", callback_data: "stocks_uk" }],
          [{ text: "Япония", callback_data: "stocks_japan" }],
        ],
      },
    });
  }

  if (callbackQuery.data === "calculator") {
    bot.sendMessage(chatId, "Выберите валюту или криптовалюту для пересчета:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "USD", callback_data: "calc_usd" }],
          [{ text: "EUR", callback_data: "calc_eur" }],
          [{ text: "BTC", callback_data: "calc_btc" }],
          [{ text: "ETH", callback_data: "calc_eth" }],
        ],
      },
    });
  }

  // Обработка выбора акций по странам
  if (callbackQuery.data.startsWith("stocks_")) {
    const selectedCountry = callbackQuery.data.split("_")[1].toUpperCase();
    const stockData = stocks[selectedCountry];

    if (stockData) {
      let stockList = `Курсы акций (${selectedCountry}):\n`;
      for (let [company, value] of Object.entries(stockData)) {
        stockList += `${company}: $${value}\n`;
      }
      bot.sendMessage(chatId, stockList);
    } else {
      bot.sendMessage(chatId, "Данные по акциям недоступны.");
    }
  }
});

// Обработка калькулятора
bot.on("callback_query", callbackQuery => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data.startsWith("calc_")) {
    const selected = callbackQuery.data.split("_")[1].toUpperCase();
    const isCurrency = currencies[selected] !== undefined;
    const isCrypto = cryptos[selected] !== undefined;

    let rate, baseCurrency;
    if (isCurrency) {
      rate = currencies[selected];
      baseCurrency = selected;
      bot.sendMessage(
        chatId,
        `Введите сумму в ${baseCurrency} для пересчета в BTC:`
      );
    } else if (isCrypto) {
      rate = cryptos[selected];
      baseCurrency = selected;
      bot.sendMessage(
        chatId,
        `Введите сумму в ${baseCurrency} для пересчета в USD:`
      );
    }

    bot.once("message", msg => {
      const amount = parseFloat(msg.text);
      if (!isNaN(amount)) {
        if (isCurrency) {
          const btcValue = (amount / rate) * cryptos.BTC;
          bot.sendMessage(
            chatId,
            `Сумма ${amount} ${baseCurrency} = ${btcValue.toFixed(8)} BTC`
          );
        } else if (isCrypto) {
          const usdValue = amount * rate;
          bot.sendMessage(
            chatId,
            `Сумма ${amount} ${baseCurrency} = $${usdValue.toFixed(2)} USD`
          );
        }
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

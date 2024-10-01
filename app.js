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

const exchanges = {
  USA: {
    name: "США",
    stocks: {
      AAPL: 150,
      TSLA: 700,
      GOOGL: 2800,
    },
  },
  GERMANY: {
    name: "Германия",
    stocks: {
      DBK: 12,
      SAP: 120,
      BMW: 90,
    },
  },
  RUSSIA: {
    name: "Россия",
    stocks: {
      SBER: 300,
      LKOH: 4500,
      YNDX: 3000,
    },
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
        [{ text: "Биржи", callback_data: "exchanges" }],
        [{ text: "Калькулятор", callback_data: "calculator" }],
      ],
    },
  });
});

// Обработка выбора валют, криптовалют, акций и бирж
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
    let cryptoData = "Выберите криптовалюту для расчета:\n";
    for (let key of Object.keys(cryptos)) {
      cryptoData += `${key}\n`;
    }
    bot.sendMessage(chatId, cryptoData, {
      reply_markup: {
        inline_keyboard: Object.keys(cryptos).map(key => [
          { text: key, callback_data: `calc_${key}` },
        ]),
      },
    });
  }

  if (callbackQuery.data === "stocks") {
    let stockData = "Актуальные курсы акций:\n";
    for (let [key, value] of Object.entries(stocks)) {
      stockData += `${key}: $${value}\n`;
    }
    bot.sendMessage(chatId, stockData);
  }

  if (callbackQuery.data === "exchanges") {
    let exchangeData = "Выберите страну для просмотра бирж:\n";
    bot.sendMessage(chatId, exchangeData, {
      reply_markup: {
        inline_keyboard: Object.keys(exchanges).map(key => [
          { text: exchanges[key].name, callback_data: `stocks_${key}` },
        ]),
      },
    });
  }

  // Обработка запроса акций для выбранной биржи
  if (callbackQuery.data.startsWith("stocks_")) {
    const countryKey = callbackQuery.data.split("_")[1];
    let stockData = `Курсы акций на бирже в ${exchanges[countryKey].name}:\n`;
    for (let [stock, price] of Object.entries(exchanges[countryKey].stocks)) {
      stockData += `${stock}: $${price}\n`;
    }
    bot.sendMessage(chatId, stockData);
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

// Обработка расчета для криптовалют
bot.on("callback_query", callbackQuery => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data.startsWith("calc_")) {
    const selected = callbackQuery.data.split("_")[1].toUpperCase();
    const isCurrency = currencies[selected] !== undefined;
    const isCrypto = cryptos[selected] !== undefined;

    if (isCrypto) {
      const rate = cryptos[selected];
      bot.sendMessage(
        chatId,
        `Введите сумму в ${selected} для пересчета в другую криптовалюту:`,
        {
          reply_markup: {
            inline_keyboard: Object.keys(cryptos)
              .filter(key => key !== selected)
              .map(key => [
                { text: key, callback_data: `convert_${selected}_${key}` },
              ]),
          },
        }
      );
    }

    if (isCurrency) {
      const rate = currencies[selected];
      bot.sendMessage(
        chatId,
        `Введите сумму в ${selected} для пересчета в другую валюту:`,
        {
          reply_markup: {
            inline_keyboard: Object.keys(currencies)
              .filter(key => key !== selected)
              .map(key => [
                { text: key, callback_data: `convert_${selected}_${key}` },
              ]),
          },
        }
      );
    }
  }

  // Обработка конверсии
  if (callbackQuery.data.startsWith("convert_")) {
    const [, from, to] = callbackQuery.data.split("_");
    const amount = parseFloat(callbackQuery.message.text);

    if (!isNaN(amount)) {
      let conversionRate;
      if (currencies[from] && currencies[to]) {
        conversionRate = currencies[to] / currencies[from];
      } else if (cryptos[from] && cryptos[to]) {
        conversionRate = cryptos[to] / cryptos[from];
      }

      if (conversionRate) {
        const convertedAmount = amount * conversionRate;
        bot.sendMessage(
          chatId,
          `Сумма ${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`
        );
      } else {
        bot.sendMessage(chatId, "Ошибка в конвертации.");
      }
    } else {
      bot.sendMessage(chatId, "Пожалуйста, введите корректную сумму.");
    }
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

![Telegram logo](https://logos-world.net/wp-content/uploads/2021/03/Telegram-Symbol.png)
<h1 align="center"> HLTV Telegram Bot </h1>
<h3 align="center">Телеграм бот для быстрого доступа к информации с HLTV.org</h3>

---

## Требования
- Telegraf.js (`npm i telegraf`)
- NodeJS v16.6 или выше
- Базовые знания JS или Telegraf.js

## Начало работы
#### Создание бота:
- 1). [Нажмите здесь, чтобы развернуть репозиторий](https://github.com/doombladeoff/HLTV-TelegramBot)
- 2). Откройте терминал и наберите `git clone https://github.com/doombladeoff/HLTV-TelegramBot.git`
#### Установка всех необходимых пакетов
- `npm install` или `npm i`
#### Запуск бота
- `node .` or `node index.js`

---

## Конфигурация
- **Отредактируйте файл `config.json` и введите необходимые значения**
```json
{
    "Token": "Ваш токен"
}
```

- **Токен можно получить через бота в самом телеграм**
- #### Получение токена:
- 1). Откройте Telegram и наберите в поиске `BotFather`
- 2). Отправьте команду `/start`, после `/newbot`
- 3). Введите названия бота чтобы его можно было найти в поиске
- 4). Полученый токен вставьте в `config.json`

const { Telegraf, session, Scenes } = require('telegraf')
const { message } = require ("telegraf/filters");

const moment  = require("moment");
const { Keyboard, Key } = require('./lib')

const { HLTV } = require('hltv');

const config = require('./config.json');

const bot = new Telegraf(config.Token);

const commandsKeyboard = Keyboard.make([
    [
        'ТОП-30 команд', 'Получить список аткивных стримов'
    ], 
    [
        'Найти игрока', 'Последние темы', 'События',
    ], 
    [
        'Топ 10 игроков', 'Найти команду'
    ]
]);
const backKeyboard = Keyboard.make(['Back']);


const main = (ctx) => {
    return ctx.reply('Привет! Чтобы пользоваться мной, используй клавиши ниже.', Keyboard.reply(['Start'], { columns: 1 }))
}

//#region  Scenes для поиска на HLTV
    // Создаем сцену для запроса
    const findUser = new Scenes.BaseScene('findUserScene');
    const findTeam = new Scenes.BaseScene('findTeamScene');

    findUser.enter((ctx) => {
    ctx.reply('Кого ищем?');
    });

    findTeam.enter((ctx) => {
        ctx.reply('Какую команду хотите найти?');
        });
    // Создаем объект сцен и добавляем в него сцену
    const stage = new Scenes.Stage([findUser, findTeam], { ttl: 10});
//#endregion

bot.start(main)
bot.hears('Back', main);
bot.use(session());
bot.use(stage.middleware());


bot.hears('Start', async (ctx) => {
    return ctx.reply(`Ниже доступные команды`, Keyboard.combine(commandsKeyboard, backKeyboard).reply())
})

bot.hears('ТОП-30 команд', (ctx) => {
    const dataTeam = [];
    const chanelID = ctx.chat.id

    HLTV.getTeamRanking().then((res) => {
        res.map(teamData => {
            dataTeam.push(`<b>${teamData.place}</b>` + '.\t' + `<b>${teamData.team.name}</b>` + '\nОчков: ' + teamData.points)
        })
        try {
            bot.telegram.sendMessage(chanelID, `<b>Вот список ТОП-30 команд HLTV</b>\n\n` + dataTeam.join('\n\n'), { parse_mode: 'HTML'})
        } catch (error) {
            console.log(error)
        }
    })
})

bot.hears('Получить список аткивных стримов', (ctx) => {
    const dataStream = [];
    const chanelID = ctx.chat.id
    HLTV.getStreams().then((res) => {
        const sliceArr = res.slice(0, 10);

        const headerText = '<b>Вот список ТОП-10 активных стримов на HLTV</b>\n\n';
        const leftLink = '<a href="';
        const rightLink = '">Ссылка на стрим</a>';

        let index = 1;
        sliceArr.map(streamData => {
            dataStream.push(headerText + `<b>${index++}. ${streamData.name}</b>`+ '\nЗрителей:\t' + streamData.viewers + '\nСтрана:\t' + streamData.country.name + '\n' + leftLink+streamData.link+rightLink);
        });
        try {
            const message = dataStream.join('\n\n');
            bot.telegram.sendMessage(chanelID, message, { parse_mode: 'HTML' })
        } catch (error) {
            console.error(error)
        }
        
      })
})

bot.hears('Найти игрока', (ctx) => {

    ctx.scene.enter('findUserScene')

    findUser.on('text', (ctx) => {
        const chanelID = ctx.chat.id
        const requestFindUser = ctx.message.text;

        ctx.reply(`Ищу ${requestFindUser}...`);
        HLTV.getPlayerByName({ name: requestFindUser })
        .catch(error => {
            console.log(error);
            return ctx.reply('Такой игрок не найден 😞')
        })
        .then(async res => {
            console.log(res)
            try {
                const messageUserHLTV = {
                    User: {
                        name: 'Имя: ' + res.name + '\n',
                        age: 'Возраст: ' + res.age + '\n',
                        nickname: 'Никнейм: ' + res.ign + '\n',
                        country: 'Страна: ' + res.country.name + '\n',
                        currentTeam: 'Текущая команда: ' + res.team.name + '\n',
                    },

                    Statistic: {
                        deathsPerRound: 'Семертей за раун: ' + res.statistics.deathsPerRound + '\n',
                        headshots: 'Процент убийств в голову: ' + res.statistics.headshots + '\n',
                        killsPerRound: 'Убийств за раунд: ' + res.statistics.killsPerRound + '\n',
                        mapsPlayed: 'Сыграных карт: ' + res.statistics.mapsPlayed + '\n',
                        rating: 'Рейтинг: ' + res.statistics.rating + '\n',
                        roundsContributed: 'Текущая команда: ' + res.statistics.roundsContributed + '\n'
                    },

                    Socials: {
                        twitter: 'Твиттер: ' + res.twitter + '\n',
                        twitch: 'Твитч: ' + res.twitch + '\n',
                        instagram: 'Инстаграм: ' + res.instagram + '\n'
                    }
                }

                bot.telegram.sendMessage(chanelID, `Вот кого нашли:\n\n` + 
                    messageUserHLTV.User.name +
                    messageUserHLTV.User.age +
                    messageUserHLTV.User.nickname +
                    messageUserHLTV.User.country +
                    messageUserHLTV.User.currentTeam +
                    "\n\nСтатистика\n" +
                    messageUserHLTV.Statistic.deathsPerRound +
                    messageUserHLTV.Statistic.headshots +
                    messageUserHLTV.Statistic.killsPerRound +
                    messageUserHLTV.Statistic.mapsPlayed +
                    messageUserHLTV.Statistic.rating +
                    messageUserHLTV.Statistic.roundsContributed +
                    "\n\nСоциальные сети\n" +
                    messageUserHLTV.Socials.twitter +
                    messageUserHLTV.Socials.twitch +
                    messageUserHLTV.Socials.instagram, 
                { parse_mode: 'HTML' })
            } catch (error) {
                console.error(error)
            }
        })
    ctx.scene.leave();
    });

})

bot.hears('Последние темы', (ctx) => {
    let messageThread = []

    HLTV.getRecentThreads().then((res) => {
        let index = 1;
        messageThread.push("<b>Список последних тем:</b>\n")
        let category = String;
        res.map(thread => {

            switch (thread.category) {
                case 'cs':
                    category = 'Counter Strike'
                    break;
                case 'match':
                    category = 'Матч'
                    break;
                case 'news':
                    category = 'Новости'
                    break;
            }
            messageThread.push(`<b>${index++}. ${thread.title}</b>\n<b>Категория:</b>\t\t${category}\n<a href="hltv.org${thread.link}">Ссылка на пост</a>\n`)
        })
        try {
            ctx.reply(messageThread.join('\n').toString(), {parse_mode: 'HTML'})
        } catch (error) {
            console.log(error)
            return ctx.reply('Что-то пошло не так... 😞')
        }
      })
})

bot.hears('События', (ctx) => {
    let eventData = []
    HLTV.getEvents().then(res => {
        var currentYear = moment(new Date()).format('YYYY')
        eventData.push(`<b>Cобытия на текущий год (${currentYear})</b>\n`)
        let index = 1;
        res.map(event => {
            var eventYear = moment(event.dateStart).format('YYYY')
            var getEventDateStart = moment(event.dateStart).format('DD-MM-YYYY')
            var getEventDateEnd = moment(event.dateEnd).format('DD-MM-YYYY')

            if (eventYear == currentYear) {
                if((event.location) && (event.prizePool)){
                    switch (event.prizePool) {
                        case 'Other':
                            event.prizePool = 'Неизвестно'
                            break;
                    }
                    eventData.push(`<b>${index++}. ${event.name}</b>\n<b>Время проведения:</b>\n\t\tНачало:\t\t${getEventDateStart}\n\t\tКонец:\t\t${getEventDateEnd}\n<b>Место проведения:</b>\t\t${event.location.name}\n<b>Призовые:</b>\t\t${event.prizePool}\n`)
                } else {
                    eventData.push(`<b>${index++}. ${event.name}</b>\n<b>Время проведения:</b>\n\t\tНачало:\t\t${getEventDateStart}\n\t\tКонец:\t\t${getEventDateEnd}\n`)
                }
            }
        })
        try {
            ctx.reply(eventData.join('\n').toString(), {parse_mode: 'HTML'})
        } catch (error) {
            console.log(error)
        }
    })
})

bot.hears('Топ 10 игроков', async (ctx) => {
    await ctx.reply('Это может занать некоторое время... 😉')
    let playerData = [];

    // var getEndDate = moment(new Date()).format('YYYY-MM-DD')
    // var getStartDate = moment().subtract(7, 'days').format('YYYY-MM-DD');

    HLTV.getPlayerRanking({}).then(res => {
        playerData.push(`<b>Tоп 10 игроков</b>\n`);

        const top10 = res.slice(0, 10)

        let index = 1;
        top10.map(player => {
            playerData.push(`<b>${index++}. ${player.player.name}</b>\n<b>Команда:</b>\t\t${player.teams[0].name}\n<b>Рейтинг:</b>\t\t${player.rating1}\n<b>Статистика:</b>\n<b>KD</b>\t\t${player.kd}\n<b>KD Diff:</b>\t\t${player.kdDiff}\n<b>Сыграных карт:</b>\t\t${player.maps}\n<b>Раундов:</b>\t\t${player.rounds}\n`)
        })

        try {
            ctx.reply(playerData.join('\n').toString(), {parse_mode: 'HTML'})
        } catch (error) {
            console.error(error)
        }

    })
    .catch(err => console.error(err))
})

bot.hears('Найти команду', (ctx) => {
    ctx.scene.enter('findTeamScene')
    findTeam.on('text', async (ctx) => {
        const requestFindTeam = ctx.message.text;
        await ctx.reply(`Ищу ${requestFindTeam}...`);

        let teamText = [];

        HLTV.getTeamByName({ name: requestFindTeam})
            .then(res => {
                console.log(res)
                let textString = `<b>Команда ${res.name}</b>\n` + `\n<b>Страна:</b>\t\t${res.country.name}\n` + `\n<b>Состав:</b>`

                for(let i = 0; i < res.players.length; i++) {
                    switch (res.players[i].type) {
                        case 'Starter':
                            res.players[i].type = 'Игрок'
                            break;
                        case 'Benched':
                            res.players[i].type = 'В запасе'
                            break;
                        case 'Coach':
                            res.players[i].type = 'Тренер'
                            break;
                    }
                    teamText.push(`\n${i+1}. <b><u>${res.players[i].name}</u></b>\n\t\t\t<b>Роль:</b>\t\t${res.players[i].type}`)
                }

                teamText.push(`\n\n<b>Соц. сети:</b>\n${res.twitter}\n${res.instagram}`)
                ctx.reply(textString + teamText.toString(), {parse_mode: 'HTML'})
            })
            .catch(err => {
                console.error(err)
                ctx.reply(`Мне не удалось найти команду <b><u>${requestFindTeam}</u></b>. 😞\n\nИспользуйте команду заново и попробуйте ввести название на английском языке!`, { parse_mode: 'HTML'})
            })
        
    ctx.scene.leave();
    });



})

bot.launch();
console.log('[ BOT ] Starting')

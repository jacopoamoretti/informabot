/*
 * Stefano Volpe
 * 08/26/2021
 *
 * index.js: entry point of the project. Hardcoding messages is fine, as this is
 * a very small project.
 */

// Setup
if (process.argv.length != 3)
  console.log("usage: node index.js token");
process.env.NTBA_FIX_319 = 1;
const axios = require('axios'),
  actions = require('./json/actions.json'),
  memes = require('./json/memes.json'),
  TelegramBot = require('node-telegram-bot-api'),
  bot = new TelegramBot(process.argv[2], {polling: true});

const options = {
  "parse_mode": "HTML",
  "disable_web_page_preview": 1,
};

function message(msg, text) {
  bot.sendMessage(msg.chat.id, text, options).catch(e => console.error(e.stack));
}

function timetable(msg) {
  axios.get("https://corsi.unibo.it/laurea/informatica/orario-lezioni/@@orario_reale_json?anno=2")
    .then(res => {
      let now = new Date();
      let todayLectures = [];
      for (let i = 0; i < res.data.length; ++i) {
        let start = new Date(res.data[i].start);
        if (start.getFullYear() === now.getFullYear() &&
          start.getMonth() === now.getMonth() &&
          (start.getDate() === now.getDate()))
          todayLectures.push(res.data[i]);
      }

      let text = "";
      todayLectures.sort((a, b) => {
        if (a.start > b.start)
          return 1;
        if (a.start < b.start)
          return -1;
        return 0;
      });
      for (let i = 0; i < todayLectures.length; ++i)
        text += "🕘 <b>" + todayLectures[i].title + "</b> " + todayLectures[i].time + "\n";
      if (todayLectures.length !== 0)
        message(msg, text);
      else
        message(msg, "Non ci sono lezioni oggi. SMETTILA DI PRESSARMI");
    }).catch(e => console.error(e.stack));
}

function course(msg, name, virtuale, teams, website, professors) {
  const emails = professors.join("@unibo.it\n  ") + "@unibo.it";
  message(msg, `<b>${name}</b>
  <a href='https://virtuale.unibo.it/course/view.php?id=${virtuale}'>Virtuale</a>
  <a href='https://teams.microsoft.com/l/meetup-join/19%3ameeting_${teams}%40thread.v2/0?context=%7b%22Tid%22%3a%22e99647dc-1b08-454a-bf8c-699181b389ab%22%2c%22Oid%22%3a%22080683d2-51aa-4842-aa73-291a43203f71%22%7d'>Videolezione</a>
  <a href='https://www.unibo.it/it/didattica/insegnamenti/insegnamento/${website}'>Sito</a>
  <a href='https://www.unibo.it/it/didattica/insegnamenti/insegnamento/${website}/orariolezioni'>Orario</a>
  ${emails}`);
}

function act(msg, action) {
  switch (action.type) {
    case "alias":
      act(msg, actions[action.command]);
      break;
    case "course":
      course(msg, action.name, action.virtuale, action.teams, action.website, action.professors);
      break;
    case "message":
      message(msg, action.text);
      break;
    case "timetable":
      timetable(msg);
      break;
    default:
      console.error(`Unknown action type "${action.type}"`);
  }
}

function onMessage(msg) {
  if (msg.text) {
    const text = msg.text.toString()
    if (text[0] == '/') {
      // "/command param0 ... paramN" -> "command"
      const command = text.toLowerCase().split(" ")[0].substring(1);
      if (command in actions)
        act(msg, actions[command]);
      else if (command in memes)
        message(msg, memes[command]);
    }
  }
}

bot.on('message', onMessage);

import db from "./services/db";
import MessagePassing from "./services/messagePassing";
import guid from "./services/guid";
import EmojiWorker from "./services/emoji.worker";
import TranslationWorker from "./services/translation.worker";
import commandService from "./services/commandsService";
import chromeService from "./services/chromeService";

const emojiWorker = new EmojiWorker();
const translationWorker = new TranslationWorker();

const Routes = async (voice, contextMenus) => {
  let commands;
  let textReplacementObj = {};
  MessagePassing.setOptions({ emojiWorker, translationWorker });
  const { defaultLanguage, capitalization, textReplacementMap } = await db.get(
    "defaultLanguage",
    "capitalization",
    "textReplacementMap"
  );
  textReplacementObj = textReplacementMap;
  // fetch backend commands
  commands = await commandService.getCommands(defaultLanguage.code, "backend");
  /** process text given by speech input or text input */
  const processInput = async (text, options) => {
    if (textReplacementObj[text]) {
      text = textReplacementObj[text];
    }
    else if (capitalization & text != "") {
      text[0].toUpperCase();
    }
    await commandService.getMatchingCommand(commands, text, options, (command, args) => {
      if (command) {
        const { originalText, commandContent } = args;
        command.exec(commandContent, { originalText }, message => {
          if (message) {
            //send backend command message to active tab if any
            MessagePassing.sendMessageToActiveTab(
              "/message",
              { message },
              () => {}
            );
          }
        });
      } else {
        const payload = {
          text,
          langId: defaultLanguage.code,
          langLabel: defaultLanguage.label,
          mode: options.mode,
        };
        MessagePassing.sendMessageToActiveTab("/sr_text", payload, () => {});
      }
    });
  };
  voice.addCommand({
    "*text": text => {
      processInput(text, { mode: "speech" });
    }
  });
  // listen for commands from commands popup
  MessagePassing.on("/process_input", async req => {
    const { text } = req;
    processInput(text, { mode: "text" });
  });
  // listen to requests for navigation for internal extension pages only.
  MessagePassing.on("/navigation_req", async req => {
    const { sub_path } = req;
    chromeService.openHelpPage(sub_path);
  });
  // save selected text in storage instead writing it to clipboard
  MessagePassing.on("/set_selected_text", async req => {
    const { data } = req;
    await db.set({ data: data });
  });
  //retrieve stored data
  MessagePassing.on("/get_data", async (req, res) => {
    const data = await db.get("data");
    res(data);
  });
  //send speech recognition data
  MessagePassing.on("/start_speech_recognition", async () => {
    const { state } = await voice.permissionGranted();
    if (state == "granted") {
      const { defaultLanguage } = await db.get("defaultLanguage");
      voice.setLanguage(defaultLanguage.code);
      voice.start();
    } else {
      // send to help page
    }
  });
  //stop speech recognition
  MessagePassing.on("/stop_speech_recognition", async () => {
    voice.stop();
  });
  //toggle speech recognition
  MessagePassing.on("/toggle_sr", async (req, res) => {
    let contextMenuTitle = "";
    const { startStopSRContextMenu } = contextMenus;
    const { isMicListening } = await db.get("isMicListening");
    if (isMicListening) {
      voice.stop();
      contextMenuTitle = "Start Speech Recognition Toolkit";
    } else {
      const { defaultLanguage } = await db.get("defaultLanguage");
      voice.setLanguage(defaultLanguage.code);
      voice.start();
      contextMenuTitle = "Stop Speech Recognition Toolkit";
    }
    await db.set({ isMicListening: !isMicListening });
    chrome.contextMenus.update(
      startStopSRContextMenu,
      {
        title: contextMenuTitle
      },
      () => {}
    );
    res({ isMicListening: !isMicListening });
  });
  //restart speech recognition
  MessagePassing.on("/restart_sr", async () => {
    const { defaultLanguage, isMicListening } = await db.get(
      "defaultLanguage",
      "isMicListening"
    );
    // fetch backend commands
    commands = await commandService.getCommands(
      defaultLanguage.code,
      "backend"
    );
    if (isMicListening) {
      voice.stop();
      voice.setLanguage(defaultLanguage.code);
      voice.start();
    }
  });
  //speak sr sound
  MessagePassing.on("/speak_sr", async req => {
    const { text } = req;
    const { defaultLanguage } = await db.get("defaultLanguage");
    voice.speak(text, { lang: defaultLanguage.code });
  });
  // get mountAckId
  MessagePassing.on("/get_cs_mountAck", async (req, res) => {
    const { mountAckId } = await db.get("mountAckId");
    res({ mountAckId });
  });
  // process emoji in web worker and return data to cs request
  MessagePassing.on("/get_emoji", async (req, res, options) => {
    const { langId, emojiName } = req;
    const { emojiWorker } = options;
    const uid = guid.generateGuid();
    emojiWorker.postMessage({ langId, emojiName, uid, action: "emoji" });
    emojiWorker.addEventListener("message", emojiRes => {
      const { emoji, uid: resUid } = emojiRes.data;
      if (uid == resUid) {
        res(emoji);
      }
    });
  });
  // process emoji list in web worker and return data to cs request
  MessagePassing.on("/get_emoji_list", async (req, res, options) => {
    const { langId } = req;
    const { emojiWorker } = options;
    const uid = guid.generateGuid();
    emojiWorker.postMessage({ langId, uid, action: "emoji_list" });
    emojiWorker.addEventListener("message", emojiRes => {
      const { emojiList, uid: resUid } = emojiRes.data;
      if (uid == resUid) {
        res(emojiList);
      }
    });
  });
  /**
   * Save translated keys here incase translation requested before, return from this object.
   * */
  const translationsLocal = {};
  // get translated key
  MessagePassing.on("/get_translated_message", async (req, res, options) => {
    const { langId, key } = req;
    const localKey = `${langId}-${key}`;
    if (translationsLocal[localKey]) {
      res(translationsLocal[localKey]);
    } else {
      const { translationWorker } = options;
      const uid = guid.generateGuid();
      translationWorker.postMessage({ langId, key, uid, action: "getMessage" });
      translationWorker.addEventListener("message", emojiRes => {
        const { message, uid: resUid } = emojiRes.data;
        if (uid == resUid) {
          translationsLocal[localKey] = message;
          res(message);
        }
      });
    }
  });
  // open text replacement view
  MessagePassing.on("/open_text_replacement_view", async req => {
    const { text } = req;
    const helpUrl = `${chrome.runtime.getURL("option.html")}?path=textReplacer&text=${text}`;
    chrome.tabs.create({ url: helpUrl }, () => {});
  });
  // update text replacement view
  MessagePassing.on("/update_text_replacement_obj", async () => {
    const { textReplacementMap } = await db.get('textReplacementMap');
    textReplacementObj = textReplacementMap;
  });
  // send list of commands[translated] list.
  MessagePassing.on("/commands_list_translated", async (req, res) => {
    const { langId } = req;
    const allCommands = await commandService.getAllCommands(langId);
    const commandsList = allCommands.map(command => {
      return [
        command.match.join(", "),
        command.description,
        command.id
      ];
    });
    res(commandsList);
  });
};

export default Routes;

function main() {
  const ScriptProperties = PropertiesService.getScriptProperties();
  const TOKEN = ScriptProperties.getProperty('TOKEN');
  const CHANNEL_ID = ScriptProperties.getProperty('CHANNEL_ID');

  const unreadMessages = fetchUnreadMessages();
  unreadMessages.forEach(message => {
    const text = message.getSubject();
    const blocks = makeBlocks(message);
    const isSuccess = postMessage(TOKEN, CHANNEL_ID, text, blocks);
    if (isSuccess) message.markRead();
  });
}

const fetchUnreadMessages = () => {
  const threads = GmailApp.search('is:unread', 0, 50);
  const messagesList = GmailApp.getMessagesForThreads(threads);
  return messagesList
    .map(messages => messages.filter(message => message.isUnread()))
    .reduce((msgs, messages) => msgs.concat(messages), []);
};

const makeBlocks = (message: GoogleAppsScript.Gmail.GmailMessage) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*<https://mail.google.com/mail/u/0/#inbox/${message.getId()}|${message.getSubject()}>*`,
    },
  },
  {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Date:*\n${message.getDate().toLocaleString('ja-JP')}`,
      },
      {
        type: 'mrkdwn',
        text: `*From:*\n${message.getFrom()}`,
      },
    ],
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: message.getPlainBody().slice(0, 512),
    },
  },
  {
    type: 'divider',
  },
];

const postMessage = (
  token: string,
  channelId: string,
  text: string,
  blocks: any
) => {
  const url = 'https://slack.com/api/chat.postMessage';
  const formData = {
    icon_emoji: ':e-mail:',
    username: 'EmailBot',
    token,
    channel: channelId,
    text,
    blocks: JSON.stringify(blocks),
  };
  const options = {
    method: 'post' as const,
    payload: formData,
  };
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  if (!json.ok) {
    Logger.log(`Failed to post message: ${json.error}`);
    return false;
  }
  return true;
};

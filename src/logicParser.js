import { SessionsClient } from 'dialogflow';
import TransientMap from './utils/TransientMap';

const {
  DIALOGFLOW_PRIVATE_KEY,
  DIALOGFLOW_CLIENT_EMAIL,
  DIALOGFLOW_PROJECT_ID,
  DIALOGFLOW_LANG_CODE
} = process.env;

const map = new TransientMap({ expiry: 600000 });

const sessionClient = new SessionsClient({
  credentials: {
    private_key: DIALOGFLOW_PRIVATE_KEY,
    client_email: DIALOGFLOW_CLIENT_EMAIL
  }
});

const processIntent = async ({ sessionId, text }) => {
  const sessionPath = sessionClient.sessionPath(DIALOGFLOW_PROJECT_ID, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode: DIALOGFLOW_LANG_CODE
      }
    }
  };

  const responses = await sessionClient.detectIntent(request);
  return responses[0].queryResult;
};

const sendCfmMsg = async ({ messenger, senderId, ctx }) => {
  const { time, location } = ctx;
  await messenger.sendTextMessage({
    id: senderId,
    text: `All set!  We are planning a date for you in the *${location} of Singapore*, in the *${time}*.  Hang in tight!!`
  });

  setTimeout(() => {
    messenger.sendTextMessage({
      id: senderId,
      text: '😍😍😍'
    });
  }, Math.random(5000));
};

const sendDefaultEntry = async ({ messenger, senderId }) => {
  const EVENT_TYPE = 'SELECT_DATE_TYPE';
  return messenger.sendButtonsMessage({
    id: senderId,
    text: 'Planning a date huh 😏😏 What would you like me to do?',
    buttons: [
      {
        type: 'postback',
        title: 'Plan a first date',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'firstDate'
        })
      },
      {
        type: 'postback',
        title: 'Plan a date',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'normal'
        })
      }
    ],
    notificationType: 'REGULAR'
  });
};

const sendTimeSelectBtns = async ({ messenger, senderId }) => {
  const EVENT_TYPE = 'SELECT_TIME';
  return messenger.sendButtonsMessage({
    id: senderId,
    text: 'Please select a time.',
    buttons: [
      {
        type: 'postback',
        title: ' 🐓Morning',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'morning'
        })
      },
      {
        type: 'postback',
        title: '☀️ Afternoon',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'afternoon'
        })
      },
      {
        type: 'postback',
        title: '🌚 Evening',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'evening'
        })
      }
    ],
    notificationType: 'REGULAR'
  });
};

const sendLocSelectBtns = async ({ messenger, senderId }) => {
  const EVENT_TYPE = 'SELECT_LOC';
  return messenger.sendQuickRepliesMessage({
    id: senderId,
    attachment: 'Please select a location. 🌎',
    quickReplies: [
      {
        content_type: 'text',
        title: 'North',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'north'
        })
      },
      {
        content_type: 'text',
        title: 'South',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'south'
        })
      },
      {
        content_type: 'text',
        title: 'East',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'east'
        })
      },
      {
        content_type: 'text',
        title: 'West',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'west'
        })
      }
    ],
    notificationType: 'REGULAR'
  });
};

const sendWelcomeEntry = async ({ messenger, senderId }) => {
  await messenger.sendTextMessage({
    id: senderId,
    text: 'Hi!  My name is Paktor and we plan good dates 😏😏'
  });
  return sendDefaultEntry({ messenger, senderId });
};

/**
 * Process event begins here.
 * @param {*} event
 * @param {*} messenger
 */
const processEvent = async (event, messenger) => {
  // Destructure event
  const {
    sender: { id: senderId } = {},
    message: { text, quick_reply: { payload: quickReplyPayload } = {} } = {},
    postback: { title, payload: postbackPayload } = {}
  } = event;

  // Use either the postback or quickReply payloads
  const payload = postbackPayload || quickReplyPayload;

  // Retrieve timed context
  const context = await map.get(senderId);

  // Reset state if new context.
  if (!context.state) {
    map.set(senderId, { state: 'START' });
  }

  // Retrieve payload, handle if any
  if (payload) {
    const { type, value } = JSON.parse(payload);

    if (type === 'SELECT_DATE_TYPE') {
      map.set(senderId, { dateType: value });
      await sendTimeSelectBtns({ messenger, senderId });
      map.set(senderId, { state: 'SELECT_TIME' });
      return;
    } else if (type === 'SELECT_TIME') {
      map.set(senderId, { time: value });
      await sendLocSelectBtns({ messenger, senderId });
      map.set(senderId, { state: 'SELECT_LOC' });
      return;
    } else if (type === 'SELECT_LOC') {
      const ctx = await map.set(senderId, { location: value });
      await sendCfmMsg({ messenger, senderId, ctx });
      map.set(senderId, { state: 'GEN_DATE' });
      console.log('--------------');
      console.log(ctx);
      console.log('--------------');
      return;
    }
  }

  // Otherwise skip if no message to process
  if (!text) {
    return;
  }

  console.log(event);

  const dialogFlowRes = await processIntent({ sessionId: senderId, text });
  // console.log(dialogFlowRes);
  const intent = dialogFlowRes.intent.displayName;

  if (intent === 'Default Fallback Intent') {
    await sendWelcomeEntry({ messenger, senderId });
    return;
  }

  if (dialogFlowRes.fulfillmentText) {
    const res2 = await messenger.sendTextMessage({
      id: senderId,
      text: dialogFlowRes.fulfillmentText
    });
  }

  await sendDefaultEntry({ messenger, senderId });
};

export default processEvent;

import { SessionsClient } from 'dialogflow';

const {
  DIALOGFLOW_PRIVATE_KEY,
  DIALOGFLOW_CLIENT_EMAIL,
  DIALOGFLOW_PROJECT_ID,
  DIALOGFLOW_SESSION_ID,
  DIALOGFLOW_LANG_CODE
} = process.env;

const sessionClient = new SessionsClient({
  credentials: {
    private_key: DIALOGFLOW_PRIVATE_KEY,
    client_email: DIALOGFLOW_CLIENT_EMAIL
  }
});

const sessionPath = sessionClient.sessionPath(DIALOGFLOW_PROJECT_ID, DIALOGFLOW_SESSION_ID);

const processEvent = async (event, messenger) => {
  console.log(event);

  const senderId = event.sender.id;
  const message = event.message.text;
  const { postback: { title, payload } = {} } = event;

  if (payload === 'CHOOSE_DATE_NORMAL') {
    console.log('choose date normal!');
    return;
  }

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: DIALOGFLOW_LANG_CODE
      }
    }
  };

  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;

  // console.log(result);
  console.log(result.fulfillmentText);

  // const res = await messenger.sendTextMessage({
  //   id: senderId,
  //   text: result.fulfillmentText
  // });

  const res = await messenger.sendButtonsMessage({
    id: senderId,
    text: 'What would you like to do?',
    buttons: [
      {
        type: 'postback',
        title: 'Plan a first date',
        payload: 'CHOOSE_DATE_FIRST'
      },
      {
        type: 'postback',
        title: 'Plan a date',
        payload: 'CHOOSE_DATE_NORMAL'
      }
    ],
    notificationType: 'REGULAR'
  }); // Sends a buttons template message

  console.log(res);
};

export default processEvent;

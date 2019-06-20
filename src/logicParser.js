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

const processEvent = async event => {
  console.log(event);

  const userId = event.sender.id;
  const message = event.message.text;
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
  console.log('----------');
  console.log(result);
  console.log('----------');
  //   return sendTextMessage(userId, result.fulfillmentText);
};

export default processEvent;

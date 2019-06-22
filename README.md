## Messenger Date planner Bot

Yes. A bot that plans dates for you.

Planning dates are often lengthy affairs. This bot proposes places, based on locations and activities.

## Installation

You will need to set up `DialogFlow`, `Facebook Pages` and the `Messenger API`.

Then run

```
yarn
yarn run dev
```

## Architecture

Dialogflow is used sparingly to make responses more natural. A lazy-parsed cache is used to retrieve user context data (as I'm not too sure of how to use Google's context API, is overkill, and this solves the task perfectly).

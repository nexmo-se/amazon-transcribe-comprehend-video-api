# Amazon Transcribe Comprehend Video API


## Architecture



## Running the app

1. Populate a `.env.development` and a `.env.production` as per `.env.example`
2. In the .env files make sure to add the path to the JSON credentials file from Google
3. Run `npm install` to install dependencies
4. To run the project in dev, run `npm run server-dev` and `npm start` on a separate tab. Visit localhost:3000
5. To run the project in prod, run `npm run build` and then `npm run server-prod`
6. Configure Session Monitoring API callbacks in your account portal ($your-production-url/monitoring). The application leverages Session Monitoring API to start and stop the Experience Composer Stream automatically.

- For testing purposes you can use ngrok to test the production build. Make sure to run ngrok on port 3000 and populate the env variables.

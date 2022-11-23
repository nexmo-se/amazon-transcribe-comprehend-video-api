# Vonage Video API Medical Transcryption Analysis

This application shows how to integrate the Vonage Video API with AWS Medical transcription and Medical comprehend APIs to build a video conferencing application that performs a medical analysis on every user's speech with a focus on medical terms.

## Prerequisites

- You need to have `AccessKeyId` and `SecretAccessKey` from AWS configured with the following policy

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "comprehendmedical:DescribeEntitiesDetectionV2Job",
                "comprehendmedical:DetectEntitiesV2",
                "comprehendmedical:InferRxNorm",
                "transcribe:StartStreamTranscription",
                "transcribe:StartMedicalStreamTranscriptionWebSocket",
                "transcribe:StartMedicalStreamTranscription",
                "transcribe:ListMedicalTranscriptionJobs",
                "transcribe:StartStreamTranscriptionWebSocket",
                "transcribe:ListMedicalVocabularies",
                "comprehendmedical:InferICD10CM"
            ],
            "Resource": "*"
        }
    ]
}
```

## Running the app

1. Populate a `.env.development` and a `.env.production` as per `.env.example`
2. In the .env files make sure to add the path to the JSON credentials file from Google
3. Run `npm install` to install dependencies
4. To run the project in dev, run `npm run server-dev` and `npm start` on a separate tab. Visit localhost:3000
5. To run the project in prod, run `npm run build` and then `npm run server-prod`

- For testing purposes you can use ngrok to test the production build. Make sure to run ngrok on port 3000 and populate the env variables.

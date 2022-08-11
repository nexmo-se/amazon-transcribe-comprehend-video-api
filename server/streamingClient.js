'use strict';
const path = require('path');
let env = process.env.NODE_ENV || 'development';
console.log(env);
const envPath = path.join(__dirname, '..');
console.log('envPath', envPath);
const { logger } = require('./loggerService');

require('dotenv').config({ path: `${envPath}/.env.${env}` });
// require('dotenv').config();
const GOOGLE_APPLICATION_CREDENTIALS =
  process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log(GOOGLE_APPLICATION_CREDENTIALS);

if (!GOOGLE_APPLICATION_CREDENTIALS) throw new Error('creds missing');
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const model = 'command_and_search';
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const util = require('util');

class StreamingClient {
  constructor(id, user) {
    this.id = id;
    this.user = user;
    console.log('Streaming UUID: ' + id);
    this.init = this.init.bind(this);
    this.recognizeStream = null;
    this.ttsBuffer = null;
    this.ttsBufferSize = 0;
    this.currentTTSChunk = 0;
    this.ttsTimer = undefined;
    this.language = null;
    this.outputLanguage = null;
    this.waitingRestart = true;
    this.sessionEnding = false;
    this.audioChunkAvailableCallback = undefined;
    this.transcriptAvailableCallback = undefined;
    this.errorCallback = undefined;
    this.streamingLimit = 290000;
    this.intervalRestart = setInterval(() => {
      this.tryEndAudioStream();
      this.startRecognizer();
    }, this.streamingLimit);
    this.ttsPreference = null;
  }

  setFromLanguage(language) {
    console.log('setting language ' + language);
    this.language = language;
  }
  setToLanguage(language) {
    this.outputLanguage = language;
  }
  setTTSPreference(preference) {
    this.ttsPreference = preference;
  }
  clearInterval() {
    clearInterval(this.intervalRestart);
  }
  setId(id) {
    this.id = id;
  }

  setAudioChunkAvailableCallback(callback) {
    this.audioChunkAvailableCallback = callback;
  }
  setTranscriptionAvailableCallback(callback) {
    this.transcriptAvailableCallback = callback;
  }

  async init() {
    this.speechClient = new speech.SpeechClient();
    this.ttsClient = new textToSpeech.TextToSpeechClient();
    this.translationClient = new Translate();
  }

  sendMessage(msg) {
    if (!this.waitingRestart) {
      this.recognizeStream.write(msg);
      // fs.appendFileSync('out.pcm',msg);
    }
  }

  startRecognizer() {
    const config = {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      model: model,
      enableAutomaticPunctuation: true,
      languageCode: this.language,
    };

    const request = {
      config: config,
      interimResults: false,
    };
    this.recognizeStream = this.speechClient.streamingRecognize(request);
    this.recognizeStream.on('data', async (data) => {
      let originalText = data.results[0].alternatives[0].transcript;
      // this.transcriptAvailableCallback({
      //   original: originalText,
      // });
      // console.log('[' + this.id + '][User]' + originalText);
      logger.log({
        level: 'info',
        ASR_original_speech: `${originalText}`,
      });
      let translatedText = await this.translate(originalText);
      if (this.transcriptAvailableCallback) {
        this.transcriptAvailableCallback({
          original: originalText,
          translated: translatedText,
          id: this.id,
          user: this.user,
        });
      }
      this.playTTS(translatedText);
    });

    this.recognizeStream.on('error', (err) => {
      console.error(err);
      this.tryEndAudioStream();
      if (this.errorCallback) {
        this.errorCallback(err);
      }
    });

    this.recognizeStream.on('finish', (res) => {
      this.closeConversation();
    });
    console.log('[' + this.id + '] Stream finished');
    this.waitingRestart = false;
    // clearInterval(this.intervalRestart);
    return this.recognizeStream;
  }

  tryEndAudioStream() {
    if (this.recognizeStream) {
      this.recognizeStream.destroy();
      this.recognizeStream.removeAllListeners('data');
      this.recognizeStream = null;
      console.log('[' + this.id + '] Stream Destroyed');
    } else {
      clearInterval(this.intervalRestart);
    }
  }

  closeConversation() {
    this.tryEndAudioStream();
  }
  async translate(text) {
    let output = '';
    try {
      let [translations] = await this.translationClient.translate(
        text,
        this.outputLanguage
      );
      translations = Array.isArray(translations)
        ? translations
        : [translations];
      translations.forEach((translation, i) => {
        output += `${translation}`;
      });
    } catch (err) {
      console.log(err);
    }

    // console.log(output);
    logger.log({
      level: 'info',
      translation: `: ${output}`,
    });
    return output;
  }

  async playTTS(text, isSessionEnding = false) {
    try {
      this.sessionEnding = isSessionEnding;
      const request = {
        input: { text: text },
        voice: { languageCode: this.outputLanguage, ssmlGender: 'NEUTRAL' },
        audioConfig: {
          audioEncoding: encoding,
          sampleRateHertz: sampleRateHertz,
        },
      };
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      if (this.audioChunkAvailableCallback) {
        // this.audioChunkAvailableCallback({ uuid: this.id, chunk: response.audioContent, user: this.user });
        this.audioChunkAvailableCallback(response.audioContent);
      }
    } catch (err) {
      if (this.errorCallback) {
        this.errorCallback(err);
      }
    }
  }
}

module.exports = StreamingClient;

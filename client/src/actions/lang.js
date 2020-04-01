import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import {
  TRANSLATE,
  SPEAK,
  STORE_TRANSLATED_AUDIO,
  LISTEN,
  TRANSLATE_TRANSCRIPTION,
  SAVE,
  CLEAR,
  DELETE_SAVED,
  PUSH_TRANS
} from "./types";
import playSound from "../utils/playSound";

export const deleteSaved = transId => dispatch => {
  try {
    dispatch({
      type: DELETE_SAVED,
      payload: { transId }
    });
  } catch (err) {
    console.log(err);
  }
};

export const save = ({ preTrans, postTrans, translatedAudio }) => dispatch => {
  try {
    dispatch({
      type: SAVE,
      payload: {
        transId: uuidv4(),
        preTrans,
        postTrans,
        translatedAudio
      }
    });
    dispatch(clear());
  } catch (err) {
    console.log(err);
  }
};

export const clear = () => dispatch => {
  try {
    dispatch({ type: CLEAR });
  } catch (err) {
    console.log(err);
  }
};

export const translate = formData => async dispatch => {
  try {
    const translateParams = {
      text: formData,
      modelId: "en-es"
    };
    const body = translateParams;
    const res = await axios.post("/api/translator", body);
    dispatch({
      type: TRANSLATE,
      payload: { preTrans: formData, postTrans: res.data }
    });
    dispatch({
      type: PUSH_TRANS,
      payload: {
        transId: uuidv4(),
        preTrans: formData,
        postTrans: res.data,
        translatedAudio: ""
      }
    });
  } catch (err) {
    console.log(err);
  }
};

export const textToSpeech = (
  preTrans,
  postTrans,
  speaking
) => async dispatch => {
  try {
    var xhr = new XMLHttpRequest(),
      blob,
      fileReader = new FileReader();

    xhr.open("GET", "https://www.kozco.com/tech/piano2.wav", true);
    xhr.responseType = "arraybuffer";
    xhr.addEventListener(
      "load",
      function() {
        if (xhr.status === 200) {
          blob = new Blob([xhr.response], { type: "audio/webm" });

          fileReader.onload = function(evt) {
            var result = evt.target.result;
            dispatch({
              type: STORE_TRANSLATED_AUDIO,
              payload: { translatedAudio: result }
            });
            if (speaking) {
              dispatch(speak(preTrans, postTrans, result, speaking));
            } else {
              dispatch(save({ preTrans, postTrans, translatedAudio: result }));
            }
          };
          fileReader.readAsDataURL(blob);
        }
      },
      false
    );
    xhr.send();
    // const synthesizeParams = {
    //   text: postTrans,
    //   accept: "audio/mp3",
    //   voice: "es-ES_LauraVoice"
    // };
    // const config = {
    //   responseType: "arraybuffer"
    // };
    // const body = synthesizeParams;
    // const res = await axios.post("/api/translator/speak", body, config);
    // const audio = res.data;
    // const fileReader = new FileReader();
    // const blob = new Blob([audio], { type: "audio/webm" });
    // fileReader.onload = function(event) {
    //   const result = event.target.result;
    //   dispatch({
    //     type: STORE_TRANSLATED_AUDIO,
    //     payload: { translatedAudio: result }
    //   });
    //   if (speaking) {
    //     dispatch(speak(preTrans, postTrans, result, speaking));
    //   } else {
    //     dispatch(save({ preTrans, postTrans, translatedAudio: result }));
    //   }
    // };
    // fileReader.readAsDataURL(blob);
  } catch (err) {
    console.log(err);
  }
};

export const speak = (
  preTrans,
  postTrans,
  translatedAudio,
  speaking
) => async dispatch => {
  try {
    if (!speaking) {
      dispatch(save({ preTrans, postTrans, translatedAudio }));
    } else {
      const fileReader = new FileReader();
      function dataURLtoBlob(dataUrl) {
        var arr = dataUrl.split(","),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }
      fileReader.onload = function(event) {
        const result = event.target.result;
        playSound(result);
      };
      fileReader.readAsArrayBuffer(dataURLtoBlob(translatedAudio));
      dispatch({
        type: SPEAK
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const listen = blob => async dispatch => {
  try {
    const config = {
      headers: {
        "Content-Type": "blob.type"
      }
    };
    const transcribedRes = await axios.post(
      "/api/translator/listen",
      blob,
      config
    );
    dispatch({
      type: LISTEN,
      payload: { transcribed: transcribedRes.data }
    });
    const translateParams = {
      text: transcribedRes.data,
      modelId: "es-en"
    };
    const body = translateParams;
    const translatedRes = await axios.post("/api/translator", body);
    dispatch({
      type: TRANSLATE_TRANSCRIPTION,
      payload: { translatedTranscription: translatedRes.data }
    });
  } catch (err) {
    console.log(err);
  }
};

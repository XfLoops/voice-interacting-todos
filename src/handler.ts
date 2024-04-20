export async function requestPermission() {
  try {
    const granted = await navigator.mediaDevices?.getUserMedia({
      audio: true,
    });
    console.log("[requestPermission] granted: ", granted?.active);
    return granted;
  } catch (error) {
    console.error("[requestPermission] error: ", error);
    return false;
  }
}

export function parseIndex(idxStr: string) {
  const idx = parseInt(idxStr);
  const words = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];

  const result = isNaN(idx) ? words.indexOf(idxStr.toLowerCase()) : idx - 1;
  console.log("[parseIndex] input: ", idxStr, "output: ", result);
  return result;
}

export function startSpeechRecognition(cb: (transcript: string) => void) {
  const SpeechRecognition =
    // @ts-ignore
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    const lastTranscript =
      event.results[event.results.length - 1][0].transcript;

    cb(lastTranscript);
  };

  recognition.start();
}

import { GagType } from "./domain";

interface TextPartEmote {
  type: "emote";
  delimiter: string;
  content: string;
}

interface TextPartOOC {
  type: "ooc";
  content: string;
}

interface TextPartSpeech {
  type: "speech";
  content: string;
}

type TextPart = TextPartEmote | TextPartOOC | TextPartSpeech;

interface State {
  current: TextPart;
  lastChar: string;
  allParts: TextPart[];
}
const emptyPart = (): TextPartSpeech => ({ type: "speech", content: "" });
const makeState = (): State => ({
  allParts: [],
  current: emptyPart(),
  lastChar: "",
});

const garbleLetter = (H: string): string => {
  if (H == "v" || H == "b" || H == "c" || H == "t") return "e";
  if (H == "q" || H == "k" || H == "x") return "k";
  if (H == "w" || H == "y" || H == "j" || H == "l" || H == "r") return "a";
  if (H == "s" || H == "z") return "h";
  if (H == "d" || H == "f") return "m";
  if (H == "p") return "f";
  if (H == "g") return "n";
  if (
    H == " " ||
    H == "!" ||
    H == "?" ||
    H == "." ||
    H == "~" ||
    H == "-" ||
    H == "a" ||
    H == "e" ||
    H == "i" ||
    H == "o" ||
    H == "u" ||
    H == "m" ||
    H == "n" ||
    H == "h"
  )
    return H;

  // Accents/Latin characters
  if (H == "á" || H == "â" || H == "à") return "a";
  if (H == "é" || H == "ê" || H == "è" || H == "ë") return "e";
  if (H == "í" || H == "î" || H == "ì" || H == "ï") return "i";
  if (H == "ó" || H == "ô" || H == "ò") return "o";
  if (H == "ú" || H == "û" || H == "ù" || H == "ü") return "u";
  if (H == "ç") return "s";
  if (H == "ñ") return "n";

  // Cyrillic characters
  if (H == "в" || H == "ф" || H == "б" || H == "п") return "фы";
  if (H == "г" || H == "к" || H == "х") return "к";
  if (H == "в" || H == "у" || H == "ж" || H == "л" || H == "р") return "а";
  if (H == "с" || H == "я") return "х";
  if (H == "д" || H == "ф") return "м";
  if (H == "р") return "ф";
  if (H == "г") return "н";
  return H;
};

const garbles: Record<GagType, (input: string) => string> = {
  [GagType.Total]: () => "",
  [GagType.None]: (s) => s,
  [GagType.Moans]: () => "Mmmmmph",
  [GagType.Ball]: (s) =>
    [...s]
      .map((s) => s.toLocaleLowerCase())
      .map(garbleLetter)
      .reduce((a, b) => a + b, ""),
};

export const garble = (input: string, level: GagType): string => {
  console.log("garble", { input });
  const finalState = [...input].reduce((state: State, c): State => {
    switch (state.current.type) {
      case "ooc": {
        if (c === ")" && state.lastChar === ")") {
          return {
            allParts: [
              ...state.allParts,
              { type: "ooc", content: state.current.content.slice(0, -1) },
            ],
            current: emptyPart(),
            lastChar: c,
          };
        } else {
          return {
            allParts: state.allParts,
            current: { type: "ooc", content: state.current.content + c },
            lastChar: c,
          };
        }
      }
      case "emote": {
        if (c === state.current.delimiter && state.lastChar !== " ") {
          return {
            allParts: [...state.allParts, state.current],
            current: emptyPart(),
            lastChar: c,
          };
        }
        return {
          allParts: state.allParts,
          current: {
            type: "emote",
            content: state.current.content + c,
            delimiter: state.current.delimiter,
          },
          lastChar: c,
        };
      }
      case "speech": {
        if (c !== " " && (state.lastChar === "*" || state.lastChar === "_")) {
          return {
            allParts: [
              ...state.allParts,
              {
                type: "speech",
                content: state.current.content.slice(0, -1),
              },
            ],
            current: { type: "emote", content: c, delimiter: state.lastChar },
            lastChar: c,
          };
        }

        if (c !== "*" && c !== "_") {
          if (c === "(" && state.lastChar === "(") {
            return {
              allParts: [
                ...state.allParts,
                {
                  type: "speech",
                  content: state.current.content.slice(0, -1),
                },
              ],
              current: { type: "ooc", content: "" },
              lastChar: c,
            };
          }
          return {
            allParts: state.allParts,
            current: { type: "speech", content: state.current.content + c },
            lastChar: c,
          };
        }

        return {
          allParts: state.allParts,
          current: { type: "speech", content: state.current.content + c },
          lastChar: c,
        };
      }
    }
  }, makeState());

  // first, extracts OOC and emotes

  const makeFinalPart = (): TextPart => {
    if (
      finalState.current.type === "emote" &&
      finalState.lastChar === finalState.current.delimiter
    ) {
      return {
        type: "emote",
        content: finalState.current.content.slice(0, -1),
        delimiter: finalState.current.delimiter,
      };
    }
    return {
      type: "speech",
      content: finalState.current.content,
    };
  };
  const finalPart = makeFinalPart();
  const allFinalizedParts = [...finalState.allParts, finalPart];
  console.log(allFinalizedParts);
  const result = allFinalizedParts.reduce((acc, part) => {
    switch (part.type) {
      case "emote":
        return acc + `*${part.content}*`;
      case "ooc":
        return acc + `((${part.content}))`;
      case "speech":
        return acc + garbles[level](part.content);
    }
  }, "");
  return result;
};

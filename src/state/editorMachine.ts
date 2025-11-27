import { createMachine, assign, fromPromise } from "xstate";
import { requestAI } from "../api/aiClient";

export const editorMachine = createMachine({
  id: "editor",
  initial: "idle",
  context: { aiText: "" },

  // TypeScript definitions for XState v5
  types: {} as {
    context: { aiText: string };
    events: { type: "CONTINUE"; text: string } | { type: "APPLY" };
  },

  states: {
    idle: {
      on: { CONTINUE: "loading" },
    },

    loading: {
      invoke: {
        id: "fetchAI",
        src: fromPromise(async ({ input }: { input: string }) => {
  
          if (!input) return " [Error: No text sent to AI]";
          return await requestAI(input);
        }),
       
        input: ({ event }) => (event as any).text || "",
        
        onDone: {
          target: "inserting",
          actions: assign({
   
            aiText: ({ event }) => event.output as string,
          }),
        },
        onError: {
          target: "idle",
          actions: ({ event }) => console.error("Machine Error:", event),
        },
      },
    },

    inserting: {
      on: {
        APPLY: {
          target: "idle",
          actions: assign({ aiText: "" }),
        },
      },
    },
  },
});
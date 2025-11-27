import React, { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa"; // Cross Icon
import { createRoot } from "react-dom/client";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { keymap } from "prosemirror-keymap";
import { requestAI } from "../api/aiClient";
import "prosemirror-view/style/prosemirror.css";
import "../App.css";

// Ghost State Interface
interface GhostState { text: string | null; pos: number | null; }
const ghostPluginKey = new PluginKey<GhostState>("ghost");

export type EditorRefShape = {
  getText: () => string;
  insertTextAtCursor: (text: string) => void;
  rejectLastInsertion: () => void;
  showReviewButtons: (show: boolean) => void;
};

type Props = {
  editorRef: React.MutableRefObject<EditorRefShape | null>;
  autocompleteEnabled: boolean;
  isAIActive: boolean;
  notebookMode: boolean;
  onReject: () => void;
};

export default function Editor({ 
  editorRef, 
  autocompleteEnabled, 
  isAIActive, 
  notebookMode,
  onReject,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null); // Store view reference
  
  const previousTextSnapshot = useRef<string>(""); 
  const isGeneratingRef = useRef(false);
  const aiMarkerRef = useRef<HTMLDivElement | null>(null);
  const [showMarker, setShowMarker] = useState(false);
  const debounceRef = useRef<number | null>(null);
  
  
  const enabledRef = useRef(autocompleteEnabled);
  useEffect(() => { enabledRef.current = autocompleteEnabled; }, [autocompleteEnabled]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- GHOST TEXT PLUGIN ---
    const ghostPlugin = new Plugin<GhostState>({
      key: ghostPluginKey,
      state: {
        init: () => ({ text: null, pos: null }),
        apply(tr, value) {
          const action = tr.getMeta(ghostPluginKey);
          if (action && action.type === "UPDATE_GHOST") return { text: action.text, pos: action.pos };
          if (tr.docChanged || tr.selectionSet) return { text: null, pos: null }; // Clear on typing
          return value;
        },
      },
      props: {
        decorations(state) {
          const ghostState = this.getState(state);
          if (!enabledRef.current || !ghostState?.text) return DecorationSet.empty;
          
          const ghost = Decoration.widget(ghostState.pos!, () => {
            const span = document.createElement("span");
            span.textContent = ghostState.text;
            span.className = "ghost-text";
            return span;
          }, { side: 1 });
          return DecorationSet.create(state.doc, [ghost]);
        },
        handleKeyDown(view, event) {
          if (event.key === "Tab" && enabledRef.current) {
            const ghostState = this.getState(view.state);
            if (ghostState?.text && ghostState.pos !== null) {
              event.preventDefault();
              const tr = view.state.tr.insertText(ghostState.text, ghostState.pos);
              tr.setMeta(ghostPluginKey, { type: "UPDATE_GHOST", text: null, pos: null });
              view.dispatch(tr);
              return true;
            }
          }
          return false;
        }
      },
    });

    // --- SETUP EDITOR ---
    const state = EditorState.create({
      schema,
      plugins: [keymap({}), ghostPlugin]
    });

    const view = new EditorView(containerRef.current, {
      state,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);

        // --- TRIGGER AUTOCOMPLETE ---
        if (tr.docChanged && enabledRef.current && !isGeneratingRef.current) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          
          debounceRef.current = window.setTimeout(async () => {
            if (!enabledRef.current) return;
            // Context: Last 60 chars
            const lastChars = newState.doc.textBetween(
              Math.max(0, newState.selection.to - 60), 
              newState.selection.to, 
              "\n"
            );
            
            // Trigger if user paused and context > 5 chars
            if (lastChars.length > 5) {
              try {
                // Request 'complete' mode
                const suggestion = await requestAI(lastChars, "complete");
                if (suggestion && view.state === newState) { // Check if state is still valid
                  const tr = view.state.tr;
                  tr.setMeta(ghostPluginKey, { type: "UPDATE_GHOST", text: suggestion, pos: view.state.selection.to });
                  view.dispatch(tr);
                }
              } catch (e) { /* ignore error */ }
            }
          },500); // 500ms debounce
        }
      }
    });

    viewRef.current = view;

    const getText = () => view.state.doc.textBetween(0, view.state.doc.content.size, "\n\n");
    

    const insertTextAtCursorWrapper = (text: string) => {
      if (!isGeneratingRef.current) {
        previousTextSnapshot.current = view.state.doc.textContent;
        isGeneratingRef.current = true;
      }
      const tr = view.state.tr.insertText(text, view.state.selection.to);
      view.dispatch(tr.scrollIntoView());
      view.focus();
    };

    const rejectLastInsertion = () => {
      if (isGeneratingRef.current && previousTextSnapshot.current !== "") {
        const tr = view.state.tr;

        tr.delete(0, tr.doc.content.size);
        tr.insertText(previousTextSnapshot.current, 0);
        view.dispatch(tr);
        
        isGeneratingRef.current = false;
        previousTextSnapshot.current = "";
        view.focus();
      }
    };

    const showReviewButtons = (show: boolean) => {
      setShowMarker(show);
      if (!show) {
        
        isGeneratingRef.current = false;
        previousTextSnapshot.current = "";
      }
    };

    editorRef.current = {
      getText,
      insertTextAtCursor: insertTextAtCursorWrapper,
      rejectLastInsertion,
      showReviewButtons
    };

    return () => {
      view.destroy();
      editorRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editorRef, autocompleteEnabled]); 


  useEffect(() => {
  
    if (!showMarker || !containerRef.current) {
      if (aiMarkerRef.current) aiMarkerRef.current.remove();
      return;
    }


    if (!aiMarkerRef.current) {
        const marker = document.createElement("div");
        const root = createRoot(marker);
        
 
        root.render(
          <button 
            className="reject-btn-floating" 
            onClick={(e) => {
              e.stopPropagation();
              onReject();
              setShowMarker(false);
            }}
            title="Undo Last AI Text"
            style={{ color: 'white' }}
          >
            <FaTimes color="white" />
          </button>
        );

        containerRef.current.appendChild(marker);
        aiMarkerRef.current = marker;
    }

    return () => {
        
    };
  }, [showMarker, onReject]);

  
  useEffect(() => {
      return () => {
          if (aiMarkerRef.current) aiMarkerRef.current.remove();
      };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`editor-container ${isAIActive ? "luminous-border" : ""} ${notebookMode ? "notebook-mode" : ""}`}
      style={{ position: "relative" }}
    />
  );
}
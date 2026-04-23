import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';

const InteractionContext = createContext(null);

const initialState = {
  selectedItems: new Set(),
  isDragging: false,
  dragSource: null, // 'selection' | 'folder-reorder' | null
  isCheckboxMode: false,
  checkedItems: new Set(),
  undoStack: [],
  toastVisible: false,
  toastMessage: '',
  binVisible: false,
};

function interactionReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SELECT': {
      const { id } = action.payload;
      const next = new Set(state.selectedItems);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...state, selectedItems: next };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedItems: new Set() };
    case 'SET_DRAG_START':
      return { ...state, isDragging: true, dragSource: action.payload, binVisible: action.payload === 'selection' };
    case 'SET_DRAG_END':
      return { ...state, isDragging: false, dragSource: null, binVisible: false };
    case 'ENTER_CHECKBOX_MODE':
      return { ...state, isCheckboxMode: true, checkedItems: new Set([action.payload]) };
    case 'EXIT_CHECKBOX_MODE':
      return { ...state, isCheckboxMode: false, checkedItems: new Set() };
    case 'TOGGLE_CHECKBOX': {
      const { id } = action.payload;
      const next = new Set(state.checkedItems);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...state, checkedItems: next };
    }
    case 'SHOW_TOAST':
      return {
        ...state,
        toastVisible: true,
        toastMessage: action.payload.message,
        undoStack: [
          { type: action.payload.undoType, payload: action.payload.undoPayload, ts: Date.now() },
          ...state.undoStack.slice(0, 9),
        ],
      };
    case 'HIDE_TOAST':
      return { ...state, toastVisible: false };
    case 'POP_UNDO': {
      const [, ...rest] = state.undoStack;
      return { ...state, undoStack: rest, toastVisible: false };
    }
    default:
      return state;
  }
}

export function InteractionProvider({ children }) {
  const [state, dispatch] = useReducer(interactionReducer, initialState);

  // Escape key — clears selection, checkbox mode, etc.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_SELECTION' });
        dispatch({ type: 'EXIT_CHECKBOX_MODE' });
        dispatch({ type: 'HIDE_TOAST' });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && state.toastVisible) {
        e.preventDefault();
        dispatch({ type: 'POP_UNDO' });
        // Undo logic is handled by the consumer via onUndo callback
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.toastVisible]);

  return (
    <InteractionContext.Provider value={{ state, dispatch }}>
      {children}
    </InteractionContext.Provider>
  );
}

export const useInteraction = () => {
  const ctx = useContext(InteractionContext);
  if (!ctx) throw new Error('useInteraction must be within InteractionProvider');
  return ctx;
};

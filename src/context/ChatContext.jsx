import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ChatContext = createContext(null);

const initialState = {
  user: { name: 'Chirag', avatar: 'C' },
  conversations: [],
  activeConversationId: null,
  seeds: [],
  inventory: [],
  pinnedChats: [],
};

function chatReducer(state, action) {
  switch (action.type) {

    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'NEW_CONVERSATION': {
      const requestedSeedId = action.payload?.seedId || null;
      const requestedSeedName = requestedSeedId ? state.seeds.find(s => s.id === requestedSeedId)?.name || 'Seed' : 'New Chat';

      // First check if there's already an empty conversation matching this EXACT seed configuration
      const exactEmptyMatch = state.conversations.find(c => c.messages.length === 0 && c.seedId === requestedSeedId);
      if (exactEmptyMatch) {
        return { ...state, activeConversationId: exactEmptyMatch.id };
      }

      // Otherwise if the currently active chat is already empty and has NO seed, we might just stay on it unless a specific seed was requested
      const activeConv = state.conversations.find(c => c.id === state.activeConversationId);
      if (activeConv && activeConv.messages.length === 0 && !action.payload?.force && !requestedSeedId) {
        return state;
      }

      const id = `conv_${Date.now()}`;
      const conv = {
        id,
        title: requestedSeedName,
        messages: [],
        model: 'fast',
        createdAt: Date.now(),
        pinned: false,
        seedId: requestedSeedId,
      };
      return {
        ...state,
        conversations: [conv, ...state.conversations],
        activeConversationId: id,
      };
    }

    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversationId: action.payload };

    case 'ADD_MESSAGE': {
      const { conversationId, message } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, message],
                title: c.messages.length === 0 && message.role === 'user'
                  ? c.seedId 
                    ? `${state.seeds.find(s => s.id === c.seedId)?.name || 'Seed'} - ${message.content.split(' ').slice(0, 2).join(' ').slice(0, 20)}`
                    : message.content.slice(0, 40).trim() || 'New Chat'
                  : c.title,
              }
            : c
        ),
      };
    }

    case 'UPDATE_MESSAGE': {
      const { conversationId, messageId, updates } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === messageId ? { ...m, ...updates } : m
                ),
              }
            : c
        ),
      };
    }

    case 'SET_MODEL': {
      const { conversationId, model } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, model } : c
        ),
      };
    }

    case 'RENAME_CONVERSATION': {
      const { conversationId, title } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, title } : c
        ),
      };
    }

    case 'PIN_CONVERSATION': {
      const { conversationId } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, pinned: !c.pinned } : c
        ),
      };
    }

    case 'DELETE_CONVERSATION': {
      const remaining = state.conversations.filter(c => c.id !== action.payload);
      return {
        ...state,
        conversations: remaining,
        activeConversationId: remaining.length > 0 ? remaining[0].id : null,
      };
    }

    case 'REORDER_CONVERSATIONS': {
      const { draggedId, targetId } = action.payload;
      const arr = [...state.conversations];
      const draggedIndex = arr.findIndex(c => c.id === draggedId);
      const targetIndex = arr.findIndex(c => c.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return state;
      const [removed] = arr.splice(draggedIndex, 1);
      arr.splice(targetIndex, 0, removed);
      return { ...state, conversations: arr };
    }

    case 'SORT_CONVERSATIONS': {
      const type = action.payload;
      const arr = [...state.conversations];
      if (type === 'date') {
         arr.sort((a, b) => b.createdAt - a.createdAt);
      } else if (type === 'name') {
         arr.sort((a, b) => a.title.localeCompare(b.title));
      }
      return { ...state, conversations: arr };
    }

    // Seeds
    case 'SAVE_SEED': {
      const seed = action.payload;
      const exists = state.seeds.find(s => s.id === seed.id);
      return {
        ...state,
        seeds: exists
          ? state.seeds.map(s => (s.id === seed.id ? seed : s))
          : [seed, ...state.seeds],
      };
    }

    case 'DELETE_SEED':
      return { ...state, seeds: state.seeds.filter(s => s.id !== action.payload) };

    // Inventory
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventory: [action.payload, ...state.inventory] };

    case 'REMOVE_INVENTORY_ITEM':
      return { ...state, inventory: state.inventory.filter(i => i.id !== action.payload) };

    default:
      return state;
  }
}

// --- Mock AI responses ---
const mockResponses = [
  "That's a fascinating question! Let me think through this carefully...\n\nBased on what you've shared, I'd approach this by first understanding the core problem, then systematically working through potential solutions. The key insight here is that **context matters enormously** — what works in one scenario may not translate directly to another.\n\nWould you like me to elaborate on any specific aspect?",
  "Great point! Here's my analysis:\n\n1. **First consideration** — The foundational elements need to be aligned before moving forward.\n2. **Second consideration** — There are multiple valid approaches, each with trade-offs.\n3. **Third consideration** — The optimal solution depends heavily on your specific constraints.\n\nI recommend starting with the simplest viable approach and iterating from there.",
  "Interesting! I can help with that. Let me break this down:\n\nThe core principle here involves balancing **efficiency** with **clarity**. In practice, this means:\n\n- Prioritizing readable, maintainable solutions\n- Considering edge cases from the start\n- Testing assumptions early\n\nWhat specific aspect would you like to explore further?",
  "Absolutely! This is an area where I can provide some solid guidance.\n\nThe short answer is: **it depends on your goals**. But let me give you a more nuanced perspective.\n\nConsider the trade-offs between speed and thoroughness. In most cases, a balanced approach tends to yield the best results — move quickly on low-stakes decisions, but invest more time when the stakes are higher.\n\nDoes that help clarify things?",
  "That's a thoughtful question. Here's what I think:\n\nThe fundamental challenge is that **ambiguity is unavoidable** in complex systems. The best practitioners don't try to eliminate ambiguity — they build frameworks for making good decisions *despite* it.\n\nThis usually means:\n- Establishing clear principles that guide decisions\n- Building feedback loops to catch errors early\n- Maintaining flexibility to adapt as new information emerges\n\nWould you like me to go deeper on any of these points?",
];

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState, init => {
    try {
      const saved = localStorage.getItem('koda_state');
      return saved ? { ...init, ...JSON.parse(saved) } : init;
    } catch { return init; }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('koda_state', JSON.stringify(state));
    } catch {}
  }, [state]);

  // Send a message and generate mock AI response
  const sendMessage = async (conversationId, content, model = 'fast') => {
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      liked: null,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message: userMsg } });

    // AI typing placeholder
    const aiMsgId = `msg_${Date.now() + 1}`;
    const aiMsg = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model,
      loading: true,
      liked: null,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message: aiMsg } });

    // Simulate delay
    const delay = model === 'fast' ? 800 : model === 'thinking' ? 1800 : 3000;
    await new Promise(r => setTimeout(r, delay));

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { conversationId, messageId: aiMsgId, updates: { content: response, loading: false } },
    });
  };

  const activeConversation = state.conversations.find(c => c.id === state.activeConversationId) || null;

  return (
    <ChatContext.Provider value={{ state, dispatch, sendMessage, activeConversation }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

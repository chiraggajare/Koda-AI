import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ExplorerContext = createContext(null);

const initialState = {
  tree: [
    { id: 'root', type: 'folder', name: 'Explorer', parentId: null }
  ],
  selectedFolderId: 'root',
  expandedFolderIds: ['root'],
  searchQuery: '',
  selectedItemIds: [],
  lastSelectedItemId: null,
  editingId: null
};

function explorerReducer(state, action) {
  switch (action.type) {
    case 'CREATE_FOLDER': {
      const { name, parentId } = action.payload;
      const newFolder = {
        id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'folder',
        name,
        parentId: parentId || 'root'
      };
      return {
        ...state,
        tree: [...state.tree, newFolder],
        expandedFolderIds: Array.from(new Set([...state.expandedFolderIds, parentId || 'root'])),
        editingId: newFolder.id
      };
    }
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'RENAME_NODE': {
      const { id, name } = action.payload;
      return {
        ...state,
        tree: state.tree.map(node => node.id === id ? { ...node, name } : node),
        editingId: null
      };
    }
    case 'DELETE_ITEMS': {
      const { itemIds, moveChildrenToParent } = action.payload;
      const idsToDelete = new Set(itemIds.filter(id => id !== 'root')); // Protect root

      if (idsToDelete.size === 0) return state;

      let newTree = [...state.tree];

      if (moveChildrenToParent) {
        // Move children of deleted folders to their parent
        newTree = newTree.map(n => {
          if (idsToDelete.has(n.parentId)) {
            const parentNode = state.tree.find(p => p.id === n.parentId);
            return { ...n, parentId: parentNode ? parentNode.parentId : 'root' };
          }
          return n;
        });
        // Remove deleted nodes
        newTree = newTree.filter(n => !idsToDelete.has(n.id));
      } else {
        // Recursive delete
        let size;
        do {
          size = idsToDelete.size;
          newTree.forEach(n => {
            if (idsToDelete.has(n.parentId)) idsToDelete.add(n.id);
          });
        } while (idsToDelete.size > size);
        newTree = newTree.filter(n => !idsToDelete.has(n.id));
      }

      // If selectedFolderId is deleted, default to root
      let newSelectedFolder = state.selectedFolderId;
      if (idsToDelete.has(newSelectedFolder)) newSelectedFolder = 'root';

      return {
        ...state,
        tree: newTree,
        selectedFolderId: newSelectedFolder,
        selectedItemIds: [],
        lastSelectedItemId: null
      };
    }
    case 'RESTORE_NODES': {
      const { nodes } = action.payload;
      const existingIds = new Set(state.tree.map(n => n.id));
      const nodesToAdd = nodes.filter(n => !existingIds.has(n.id));
      return {
        ...state,
        tree: [...state.tree, ...nodesToAdd]
      };
    }
    case 'MOVE_ITEMS': {
      const { itemIds, targetFolderId } = action.payload;
      if (itemIds.includes(targetFolderId)) return state; // Can't drop into self

      // Prevent dropping into descendants
      const isDescendant = (folderId, targetId) => {
        let current = state.tree.find(n => n.id === targetId);
        while (current && current.parentId) {
          if (current.parentId === folderId) return true;
          current = state.tree.find(n => n.id === current.parentId);
        }
        return false;
      };

      for (let id of itemIds) {
        if (isDescendant(id, targetFolderId)) return state; // Block circular ref
      }

      return {
        ...state,
        tree: state.tree.map(n => itemIds.includes(n.id) ? { ...n, parentId: targetFolderId } : n)
      };
    }
    case 'REORDER_ITEMS': {
      const { activeId, overId } = action.payload;
      const activeNode = state.tree.find(n => n.id === activeId);
      const overNode = state.tree.find(n => n.id === overId);

      if (!activeNode || !overNode || activeNode.parentId !== overNode.parentId) return state;

      const parentId = activeNode.parentId;
      const siblings = state.tree.filter(n => n.parentId === parentId);
      const otherNodes = state.tree.filter(n => n.parentId !== parentId);

      const oldIndex = siblings.findIndex(n => n.id === activeId);
      const newIndex = siblings.findIndex(n => n.id === overId);

      siblings.splice(oldIndex, 1);
      siblings.splice(newIndex, 0, activeNode);

      return { ...state, tree: [...otherNodes, ...siblings] };
    }
    case 'SELECT_ITEM': {
      const { id, isCtrl, isShift } = action.payload;

      if (!isCtrl && !isShift) {
        return { ...state, selectedItemIds: [id], lastSelectedItemId: id };
      }

      if (isCtrl) {
        const isSelected = state.selectedItemIds.includes(id);
        const newSelection = isSelected
          ? state.selectedItemIds.filter(i => i !== id)
          : [...state.selectedItemIds, id];
        return { ...state, selectedItemIds: newSelection, lastSelectedItemId: id };
      }

      if (isShift && state.lastSelectedItemId) {
        const targetNode = state.tree.find(n => n.id === id);
        const lastNode = state.tree.find(n => n.id === state.lastSelectedItemId);

        if (targetNode && lastNode && targetNode.parentId === lastNode.parentId) {
          const siblings = state.tree.filter(n => n.parentId === targetNode.parentId);
          const startIndex = siblings.findIndex(n => n.id === state.lastSelectedItemId);
          const endIndex = siblings.findIndex(n => n.id === id);

          const start = Math.min(startIndex, endIndex);
          const end = Math.max(startIndex, endIndex);

          const rangeIds = siblings.slice(start, end + 1).map(n => n.id);
          const newSelection = Array.from(new Set([...state.selectedItemIds, ...rangeIds]));
          return { ...state, selectedItemIds: newSelection };
        }
      }
      return state;
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedItemIds: [], lastSelectedItemId: null };
    case 'MOVE_CHAT': {
      const { chatId, targetFolderId } = action.payload;
      // If chat doesn't exist in tree yet, add it
      const existing = state.tree.find(n => n.id === chatId);
      if (existing) {
        return {
          ...state,
          tree: state.tree.map(n => n.id === chatId ? { ...n, parentId: targetFolderId } : n)
        };
      } else {
        // Added later dynamically by Chat Context sync if needed, but handled explicitly here just in case! Mapped over via ChatContext instead.
        return state;
      }
    }
    case 'SYNC_CHATS': {
      // Syncs active chats from ChatContext to tree
      const { chats } = action.payload;
      const chatIds = new Set(chats.map(c => c.id));

      // Remove deleted chats from tree
      let newTree = state.tree.filter(n => n.type === 'folder' || chatIds.has(n.id));

      // Add missing chats to root
      const existingTreeChatIds = new Set(newTree.filter(n => n.type === 'chat').map(n => n.id));
      const newlyAdded = chats.filter(c => !existingTreeChatIds.has(c.id)).map(c => ({
        id: c.id,
        type: 'chat',
        name: c.title,
        parentId: 'root'
      }));

      // Update names for existing chats
      newTree = newTree.map(n => {
        if (n.type === 'chat') {
          const matched = chats.find(c => c.id === n.id);
          if (matched && matched.title !== n.name) {
            return { ...n, name: matched.title };
          }
        }
        return n;
      });

      return { ...state, tree: [...newTree, ...newlyAdded] };
    }
    case 'SET_SELECTED_FOLDER':
      return { ...state, selectedFolderId: action.payload };
    case 'TOGGLE_EXPAND': {
      const id = action.payload;
      const set = new Set(state.expandedFolderIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...state, expandedFolderIds: Array.from(set) };
    }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

export function ExplorerProvider({ children }) {
  const [state, dispatch] = useReducer(explorerReducer, initialState, init => {
    try {
      const saved = localStorage.getItem('koda_explorer');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure root always exists
        if (!parsed.tree.find(n => n.id === 'root')) {
          parsed.tree.unshift({ id: 'root', type: 'folder', name: 'Explorer', parentId: null });
        } else {
          // Force name update
          const r = parsed.tree.find(n => n.id === 'root');
          if (r) r.name = 'Explorer';
        }
        return { ...init, ...parsed };
      }
      return init;
    } catch { return init; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('koda_explorer', JSON.stringify({
        tree: state.tree,
        expandedFolderIds: state.expandedFolderIds,
        selectedFolderId: state.selectedFolderId
      }));
    } catch { }
  }, [state.tree, state.expandedFolderIds, state.selectedFolderId]);

  return (
    <ExplorerContext.Provider value={{ state, dispatch }}>
      {children}
    </ExplorerContext.Provider>
  );
}

export const useExplorer = () => {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error('useExplorer must be used within ExplorerProvider');
  return ctx;
};

export const getSubtree = (tree, rootIds) => {
  const ids = new Set(rootIds);
  let size;
  do {
    size = ids.size;
    tree.forEach(n => {
      if (ids.has(n.parentId)) ids.add(n.id);
    });
  } while (ids.size > size);
  return tree.filter(n => ids.has(n.id));
};

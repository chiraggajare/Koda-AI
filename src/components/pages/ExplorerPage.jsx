import React, { useEffect, useState, useRef, useCallback } from 'react';
import FolderTree from '../explorer/FolderTree';
import ChatList from '../explorer/ChatList';
import Breadcrumbs from '../explorer/Breadcrumbs';
import PreviewModal from '../explorer/PreviewModal';
import { useExplorer, getSubtree } from '../../context/ExplorerContext';
import { useChat } from '../../context/ChatContext';
import { useInteraction } from '../../context/InteractionContext';
import { SelectionBadge, DragGhost, BinDropZone, UndoToast, CheckboxActionBar } from '../explorer/Overlays';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import '../explorer/Explorer.css';

export default function ExplorerPage() {
  const { state: explorerState, dispatch } = useExplorer();
  const { state: chatState, dispatch: chatDispatch } = useChat();
  const { state: ixState, dispatch: ixDispatch } = useInteraction();

  const [activeId, setActiveId] = useState(null);
  const [activeItems, setActiveItems] = useState([]);
  const [hoveredFolderId, setHoveredFolderId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const expandTimeoutRef = useRef(null);

  // Sync chats on mount and when conversations change
  useEffect(() => {
    dispatch({ type: 'SYNC_CHATS', payload: { chats: chatState.conversations } });
  }, [chatState.conversations, dispatch]);

  // Click-outside clears selection
  const handlePageClick = useCallback((e) => {
    const isRow = e.target.closest('.tree-node, .chat-card');
    if (!isRow) {
      ixDispatch({ type: 'CLEAR_SELECTION' });
    }
  }, [ixDispatch]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    const selSet = ixState.selectedItems;

    let items;
    if (selSet.has(active.id) && selSet.size > 0) {
      items = explorerState.tree.filter(n => selSet.has(n.id));
    } else {
      const node = explorerState.tree.find(n => n.id === active.id);
      items = node ? [node] : [];
    }

    setActiveItems(items);
    const src = active.data.current?.type === 'folder' && !selSet.has(active.id)
      ? 'folder-reorder'
      : 'selection';
    ixDispatch({ type: 'SET_DRAG_START', payload: src });
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (!over) {
      setHoveredFolderId(null);
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      return;
    }
    const overData = over.data.current;
    if (overData?.type === 'folder' && over.id !== activeId) {
      setHoveredFolderId(over.id);
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = setTimeout(() => {
        if (!explorerState.expandedFolderIds.includes(over.id)) {
          dispatch({ type: 'TOGGLE_EXPAND', payload: over.id });
        }
      }, 500);
    } else {
      setHoveredFolderId(null);
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItems([]);
    setHoveredFolderId(null);
    ixDispatch({ type: 'SET_DRAG_END' });
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    if (!over) return;

    const selSet = ixState.selectedItems;
    const itemsToMove = selSet.has(active.id) && selSet.size > 0
      ? Array.from(selSet)
      : [active.id];

    if (hoveredFolderId && hoveredFolderId === over.id) {
      const prevParents = itemsToMove.map(id => ({
        id,
        prevParentId: explorerState.tree.find(n => n.id === id)?.parentId,
      }));
      dispatch({ type: 'MOVE_ITEMS', payload: { itemIds: itemsToMove, targetFolderId: hoveredFolderId } });
      ixDispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: `Moved ${itemsToMove.length} item${itemsToMove.length > 1 ? 's' : ''}`,
          undoType: 'UNDO_MOVE',
          undoPayload: prevParents,
        },
      });
      return;
    }

    if (active.id !== over.id && itemsToMove.length === 1) {
      dispatch({ type: 'REORDER_ITEMS', payload: { activeId: active.id, overId: over.id } });
      ixDispatch({
        type: 'SHOW_TOAST',
        payload: { message: 'Item reordered', undoType: 'UNDO_REORDER', undoPayload: { activeId: active.id, overId: over.id } },
      });
    }
  };

  const handleDeleteDrop = useCallback(() => {
    const selSet = ixState.selectedItems;
    const ids = selSet.size > 0 ? Array.from(selSet) : activeItems.map(i => i.id);
    if (ids.length === 0) return;

    // Capture nodes for undo
    const deletedNodes = getSubtree(explorerState.tree, ids);

    dispatch({ type: 'DELETE_ITEMS', payload: { itemIds: ids, moveChildrenToParent: false } });
    ixDispatch({ type: 'CLEAR_SELECTION' });
    ixDispatch({ type: 'SET_DRAG_END' });
    ixDispatch({
      type: 'SHOW_TOAST',
      payload: { 
        message: `${ids.length} item${ids.length > 1 ? 's' : ''} deleted`, 
        undoType: 'UNDO_DELETE', 
        undoPayload: { nodes: deletedNodes } 
      },
    });
  }, [ixState.selectedItems, activeItems, explorerState.tree, dispatch, ixDispatch]);

  const handleUndo = useCallback(() => {
    const top = ixState.undoStack[0];
    if (!top) return;
    if (top.type === 'UNDO_MOVE') {
      top.payload.forEach(({ id, prevParentId }) => {
        if (prevParentId) dispatch({ type: 'MOVE_ITEMS', payload: { itemIds: [id], targetFolderId: prevParentId } });
      });
    } else if (top.type === 'UNDO_REORDER') {
      dispatch({ type: 'REORDER_ITEMS', payload: { activeId: top.payload.overId, overId: top.payload.activeId } });
    } else if (top.type === 'UNDO_DELETE') {
      dispatch({ type: 'RESTORE_NODES', payload: { nodes: top.payload.nodes } });
    }
  }, [ixState.undoStack, dispatch]);

  const handleCheckboxDelete = useCallback(() => {
    const ids = Array.from(ixState.checkedItems);
    if (ids.length === 0) return;
    
    const deletedNodes = getSubtree(explorerState.tree, ids);

    dispatch({ type: 'DELETE_ITEMS', payload: { itemIds: ids, moveChildrenToParent: false } });
    ixDispatch({ type: 'EXIT_CHECKBOX_MODE' });
    ixDispatch({
      type: 'SHOW_TOAST',
      payload: { 
        message: `${ids.length} item${ids.length > 1 ? 's' : ''} deleted`, 
        undoType: 'UNDO_DELETE', 
        undoPayload: { nodes: deletedNodes } 
      },
    });
  }, [ixState.checkedItems, explorerState.tree, dispatch, ixDispatch]);

  const customCollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    const folderCollisions = pointerCollisions.filter(c => c.data?.current?.type === 'folder');
    if (folderCollisions.length > 0) return folderCollisions;
    return rectIntersection(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="explorer-page-wrapper" onClick={handlePageClick}>
        <Breadcrumbs />
        <div className="explorer-main-area">
          <FolderTree hoveredFolderId={hoveredFolderId} onPreview={setPreviewItem} />
          <ChatList hoveredFolderId={hoveredFolderId} onPreview={setPreviewItem} />
        </div>
      </div>

      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}

      <DragOverlay dropAnimation={null}>
        {activeId && activeItems.length > 0 ? (
          <div className="drag-overlay-badge">
            <span className="badge">{activeItems.length} item{activeItems.length > 1 ? 's' : ''}</span>
            <div className="drag-overlay-name">{activeItems[0].name}</div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Global overlays */}
      <SelectionBadge />
      <DragGhost items={activeItems} visible={ixState.isDragging} />
      <BinDropZone onDrop={handleDeleteDrop} />
      <UndoToast onUndo={handleUndo} />
      <CheckboxActionBar onDelete={handleCheckboxDelete} />
    </DndContext>
  );
}

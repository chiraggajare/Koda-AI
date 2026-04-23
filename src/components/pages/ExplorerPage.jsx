import React, { useEffect, useState, useRef } from 'react';
import FolderTree from '../explorer/FolderTree';
import ChatList from '../explorer/ChatList';
import Breadcrumbs from '../explorer/Breadcrumbs';
import { useExplorer } from '../../context/ExplorerContext';
import { useChat } from '../../context/ChatContext';
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
  getFirstCollision
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import '../explorer/Explorer.css';

export default function ExplorerPage() {
  const { state: explorerState, dispatch } = useExplorer();
  const { state: chatState } = useChat();
  
  const [activeId, setActiveId] = useState(null);
  const [activeItems, setActiveItems] = useState([]);
  const [hoveredFolderId, setHoveredFolderId] = useState(null);
  const expandTimeoutRef = useRef(null);

  // Sync chats on mount and when conversations change
  useEffect(() => {
    dispatch({ type: 'SYNC_CHATS', payload: { chats: chatState.conversations } });
  }, [chatState.conversations, dispatch]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts, allows clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Determine items being dragged (include multi-select if active is selected)
    if (explorerState.selectedItemIds.includes(active.id)) {
      setActiveItems(explorerState.tree.filter(n => explorerState.selectedItemIds.includes(n.id)));
    } else {
      const activeNode = explorerState.tree.find(n => n.id === active.id);
      setActiveItems(activeNode ? [activeNode] : []);
    }
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (!over) {
      setHoveredFolderId(null);
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      return;
    }

    const overData = over.data.current;
    
    // Check if hovering over a folder (not self or descendant handled in reducer, but visually helpful)
    if (overData?.type === 'folder' && over.id !== activeId) {
      setHoveredFolderId(over.id);
      
      // Auto-expand folder on hover
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
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);

    if (!over) return;

    const overData = over.data.current;
    const activeData = active.data.current;

    const itemsToMove = explorerState.selectedItemIds.includes(active.id) 
      ? explorerState.selectedItemIds 
      : [active.id];

    // Did we drop ONTO a folder to move? (Different parent or explicit move target)
    // Custom collision/logic: if dropping on a folder, move it there. 
    // Except if dropping between items in the same container.
    if (hoveredFolderId && hoveredFolderId === over.id) {
       dispatch({ type: 'MOVE_ITEMS', payload: { itemIds: itemsToMove, targetFolderId: hoveredFolderId } });
       return;
    }

    // Otherwise, standard reorder within the same container
    if (active.id !== over.id && itemsToMove.length === 1) {
       // Reorder
       dispatch({ type: 'REORDER_ITEMS', payload: { activeId: active.id, overId: over.id } });
    }
  };

  // Custom collision detection strategy
  const customCollisionDetection = (args) => {
    // First, let's see if we are dropping directly ON a folder (pointer exact)
    const pointerCollisions = pointerWithin(args);
    const folderCollisions = pointerCollisions.filter(c => c.data?.current?.type === 'folder');
    
    if (folderCollisions.length > 0) {
      return folderCollisions; // Prioritize dropping INTO a folder
    }

    // Fallback to rect intersection for sorting
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
      <div className="explorer-page-wrapper">
        <Breadcrumbs />
        <div className="explorer-main-area">
          <FolderTree hoveredFolderId={hoveredFolderId} />
          <ChatList hoveredFolderId={hoveredFolderId} />
        </div>
      </div>
      
      <DragOverlay dropAnimation={null}>
        {activeId && activeItems.length > 0 ? (
          <div className="drag-overlay-badge">
            <span className="badge">{activeItems.length} item{activeItems.length > 1 ? 's' : ''}</span>
            <div className="drag-overlay-name">{activeItems[0].name}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

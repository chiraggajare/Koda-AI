import React, { useState, useRef, useEffect } from 'react';
import { useExplorer, getSubtree } from '../../context/ExplorerContext';
import { useInteraction } from '../../context/InteractionContext';
import {
  Folder, FolderOpen, MoreHorizontal, ChevronRight, ChevronDown,
  Plus, Edit2, Trash2, FolderPlus, GripVertical
} from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const LONG_HOLD_MS = 500;
const HOLD_DRIFT_PX = 4;

const TreeNode = ({ node, level, hoveredFolderId, index }) => {
  const { state, dispatch } = useExplorer();
  const { state: ixState, dispatch: ixDispatch } = useInteraction();
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);

  // Long-hold refs
  const holdTimer = useRef(null);
  const holdStart = useRef(null);
  const holdPos = useRef({ x: 0, y: 0 });
  const inputRef = useRef(null);

  const isExpanded = state.expandedFolderIds.includes(node.id);
  const isSelected = state.selectedFolderId === node.id;
  const isMultiSelected = ixState.selectedItems.has(node.id);
  const isChecked = ixState.checkedItems.has(node.id);
  const isEmpty = !state.tree.some(n => n.parentId === node.id);
  const children = state.tree.filter(n => n.parentId === node.id && n.type === 'folder');
  const isHoverDropTarget = hoveredFolderId === node.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: { type: 'folder', node }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_EXPAND', payload: node.id });
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (ixState.isCheckboxMode) {
      ixDispatch({ type: 'TOGGLE_CHECKBOX', payload: { id: node.id } });
      return;
    }

    // If not multi-selecting, handle navigation
    if (!e.ctrlKey && !e.metaKey) {
      dispatch({ type: 'SET_SELECTED_FOLDER', payload: node.id });
    }
  };

  const handleRenameSubmit = () => {
    if (renameVal.trim()) {
      dispatch({ type: 'RENAME_NODE', payload: { id: node.id, name: renameVal.trim() } });
    } else {
      setRenameVal(node.name);
    }
    setRenaming(false);
  };

  const executeDelete = (e, moveChildrenToParent) => {
    e.stopPropagation();
    const idsToDelete = ixState.selectedItems.size > 0 && ixState.selectedItems.has(node.id)
      ? Array.from(ixState.selectedItems)
      : [node.id];

    // Store items for undo before deleting
    const deletedNodes = getSubtree(state.tree, idsToDelete);

    dispatch({ type: 'DELETE_ITEMS', payload: { itemIds: idsToDelete, moveChildrenToParent } });
    ixDispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: `${idsToDelete.length} item${idsToDelete.length > 1 ? 's' : ''} deleted`,
        undoType: 'UNDO_DELETE',
        undoPayload: { nodes: deletedNodes }
      },
    });
    setDeleteMenuOpen(false);
    setMenuOpen(false);
  };

  // Long-hold handlers (checkbox mode)
  const handlePointerDown = (e) => {
    if (e.target.closest('button, input, a')) return;

    const isMeta = e.ctrlKey || e.metaKey;
    const isSelected = ixState.selectedItems.has(node.id);

    if (!isMeta && !isSelected) {
      ixDispatch({ type: 'CLEAR_SELECTION' });
      ixDispatch({ type: 'TOGGLE_SELECT', payload: { id: node.id } });
    } else if (isMeta) {
      ixDispatch({ type: 'TOGGLE_SELECT', payload: { id: node.id } });
    }

    holdPos.current = { x: e.clientX, y: e.clientY };
    holdStart.current = Date.now();
    holdTimer.current = setTimeout(() => {
      navigator.vibrate?.(30);
      ixDispatch({ type: 'ENTER_CHECKBOX_MODE', payload: node.id });
    }, LONG_HOLD_MS);
  };

  const handlePointerMove = (e) => {
    if (!holdTimer.current) return;
    const dx = e.clientX - holdPos.current.x;
    const dy = e.clientY - holdPos.current.y;
    if (Math.hypot(dx, dy) > HOLD_DRIFT_PX) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  useEffect(() => {
    if (state.editingId === node.id) {
      setRenaming(true);
      setRenameVal(node.name);
    }
  }, [state.editingId, node.id]);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  return (
    <div
      className="tree-node-container"
      style={{ ...style, position: 'relative', zIndex: menuOpen || isDragging ? 50 : 'auto' }}
      ref={setNodeRef}
    >
      <div
        className={[
          'tree-node',
          isSelected ? 'selected' : '',
          isMultiSelected ? 'is-selected' : '',
          isDragging ? 'dragging' : '',
          isHoverDropTarget ? 'drop-target' : '',
        ].join(' ')}
        style={{ paddingLeft: `${Math.min(level * 20 + 10, 200)}px` }}
        onClick={handleSelect}
        onDoubleClick={() => !ixState.isCheckboxMode && setRenaming(true)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        {...(!renaming ? attributes : {})}
        {...(!renaming ? listeners : {})}
      >
        {/* Checkbox */}
        {ixState.isCheckboxMode && (
          <input
            type="checkbox"
            className="row-checkbox"
            checked={isChecked}
            style={{ animationDelay: `${index * 20}ms` }}
            onChange={() => ixDispatch({ type: 'TOGGLE_CHECKBOX', payload: { id: node.id } })}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          />
        )}

        <div className={`tree-node-info ${menuOpen ? 'menu-active' : ''}`}>
          <button
            className="tree-chevron icon-btn"
            onClick={handleToggle}
            onPointerDown={e => e.stopPropagation()}
            style={{ visibility: children.length ? 'visible' : 'hidden' }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isExpanded
            ? <FolderOpen size={16} className="folder-icon" />
            : <Folder size={16} className="folder-icon" />}

          {renaming ? (
            <input
              ref={inputRef}
              className="tree-rename-input"
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={handleRenameSubmit}
              onPointerDown={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') {
                  setRenameVal(node.name);
                  setRenaming(false);
                  dispatch({ type: 'SET_EDITING_ID', payload: null });
                }
              }}
            />
          ) : (
            <span className="tree-node-name">{node.name}</span>
          )}
        </div>

        {!renaming && node.id !== 'root' && (
          <div
            className="tree-node-actions"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <button
              className="icon-btn action-btn-tiny"
              style={{ position: 'relative', zIndex: 9999 }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="menu-backdrop"
                  style={{
                    position: 'fixed', top: 0, left: 0,
                    width: '100vw', height: '100vh',
                    zIndex: 9998, background: 'transparent', pointerEvents: 'auto'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setDeleteMenuOpen(false);
                  }}
                />
                <div className="tree-context-menu anim-scale-in" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
                  <button onClick={() => {
                    dispatch({ type: 'CREATE_FOLDER', payload: { name: 'New Folder', parentId: node.id } });
                    setMenuOpen(false);
                  }}>
                    <FolderPlus size={12} /> New Folder
                  </button>
                  <button onClick={() => { setRenaming(true); setMenuOpen(false); }}>
                    <Edit2 size={12} /> Rename
                  </button>
                  <button
                    className="danger"
                    style={{ position: 'relative' }}
                    onClick={(e) => { e.stopPropagation(); setDeleteMenuOpen(!deleteMenuOpen); }}
                  >
                    <Trash2 size={12} /> Delete
                    {deleteMenuOpen && (
                      <div
                        className="sub-menu anim-fade-in"
                        style={{ position: 'absolute', right: '100%', top: 0, marginTop: '-4px' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button className="danger" onClick={(e) => executeDelete(e, false)}>
                          Delete Everything
                        </button>
                        <button onClick={(e) => executeDelete(e, true)}>
                          Keep Contents
                        </button>
                      </div>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="tree-children">
          <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {children.map((child, i) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                hoveredFolderId={hoveredFolderId}
                index={i}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};

export default function FolderTree({ hoveredFolderId }) {
  const { state, dispatch } = useExplorer();

  const rootNode = state.tree.find(n => n.id === 'root');

  const handleCreateFolder = () => {
    const parentId = state.selectedFolderId;
    dispatch({ type: 'CREATE_FOLDER', payload: { name: 'New Folder', parentId } });
  };

  return (
    <div className="folder-tree-panel glass-panel">
      <div className="folder-tree-header">
        <h3>Folders</h3>
        <button className="icon-btn" onClick={handleCreateFolder} title="New Folder">
          <Plus size={16} />
        </button>
      </div>
      <div className="folder-tree-content">
        {rootNode && (
          <SortableContext items={[rootNode.id]} strategy={verticalListSortingStrategy}>
            <TreeNode node={rootNode} level={0} hoveredFolderId={hoveredFolderId} index={0} />
          </SortableContext>
        )}
      </div>
    </div>
  );
}

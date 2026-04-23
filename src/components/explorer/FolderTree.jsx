import React, { useState } from 'react';
import { useExplorer } from '../../context/ExplorerContext';
import { Folder, FolderOpen, MoreHorizontal, ChevronRight, ChevronDown, Plus, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TreeNode = ({ node, level, hoveredFolderId }) => {
  const { state, dispatch } = useExplorer();
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);

  const isExpanded = state.expandedFolderIds.includes(node.id);
  const isSelected = state.selectedFolderId === node.id;
  const isMultiSelected = state.selectedItemIds.includes(node.id);

  const children = state.tree.filter(n => n.parentId === node.id && n.type === 'folder');

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
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      dispatch({
        type: 'SELECT_ITEM',
        payload: { id: node.id, isCtrl: e.ctrlKey || e.metaKey, isShift: e.shiftKey }
      });
    } else {
      dispatch({ type: 'SELECT_ITEM', payload: { id: node.id, isCtrl: false, isShift: false } });
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
    const idsToDelete = state.selectedItemIds.length > 0 && state.selectedItemIds.includes(node.id) 
      ? state.selectedItemIds 
      : [node.id];

    dispatch({ type: 'DELETE_ITEMS', payload: { itemIds: idsToDelete, moveChildrenToParent } });
    setDeleteMenuOpen(false);
    setMenuOpen(false);
  };

  const isHoverDropTarget = hoveredFolderId === node.id;

  return (
    <div className="tree-node-container" style={{ ...style, position: 'relative', zIndex: menuOpen || isDragging ? 50 : 'auto' }} ref={setNodeRef}>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'selected-item' : ''} ${isDragging ? 'dragging' : ''} ${isHoverDropTarget ? 'drop-target' : ''} ${menuOpen ? 'menu-active' : ''}`}
        style={{ paddingLeft: `${Math.min(level * 20 + 10, 200)}px` }}
        onClick={handleSelect}
        onDoubleClick={() => setRenaming(true)}
        {...(!renaming ? attributes : {})}
        {...(!renaming ? listeners : {})}
      >
        <div className={`tree-node-info ${menuOpen ? 'menu-active' : ''}`}>
          <button
            className="tree-chevron icon-btn"
            onClick={handleToggle}
            onPointerDown={e => e.stopPropagation()} // prevent drag
            style={{ visibility: children.length ? 'visible' : 'hidden' }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isExpanded ? <FolderOpen size={16} className="folder-icon" /> : <Folder size={16} className="folder-icon" />}

          {renaming ? (
            <input
              autoFocus
              className="tree-rename-input"
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={handleRenameSubmit}
              onPointerDown={e => e.stopPropagation()} // prevent drag
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') { setRenameVal(node.name); setRenaming(false); }
              }}
            />
          ) : (
            <span className="tree-node-name">{node.name}</span>
          )}
        </div>

        {!renaming && node.id !== 'root' && (
          <div className="tree-node-actions" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
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
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9998,
                    background: 'transparent',
                    pointerEvents: 'auto'
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
                  <button className="danger" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setDeleteMenuOpen(!deleteMenuOpen); }}>
                    <Trash2 size={12} /> Delete {state.selectedItemIds.length > 1 && state.selectedItemIds.includes(node.id) ? `(${state.selectedItemIds.length})` : ''}
                    {deleteMenuOpen && (
                      <div className="sub-menu anim-fade-in" style={{ position: 'absolute', right: '100%', top: 0, marginTop: '-4px' }} onClick={e => e.stopPropagation()}>
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
            {children.map(child => (
              <TreeNode key={child.id} node={child} level={level + 1} hoveredFolderId={hoveredFolderId} />
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
            <TreeNode node={rootNode} level={0} hoveredFolderId={hoveredFolderId} />
          </SortableContext>
        )}
      </div>
    </div>
  );
}

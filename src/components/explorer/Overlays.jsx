import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useInteraction } from '../../context/InteractionContext';
import { Trash2, FileText, Folder } from 'lucide-react';

/* ─── Selection Count Badge ──────────────────────────────────────── */
export function SelectionBadge() {
  const { state } = useInteraction();
  const count = state.selectedItems.size;
  const posRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      posRef.current = { x: e.clientX + 16, y: e.clientY + 16 };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPos({ ...posRef.current });
          rafRef.current = null;
        });
      }
    };
    document.addEventListener('pointermove', handler);
    return () => {
      document.removeEventListener('pointermove', handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (count < 2) return null;

  return ReactDOM.createPortal(
    <div
      className="selection-badge"
      style={{ left: pos.x, top: pos.y }}
    >
      {count} selected
    </div>,
    document.body
  );
}

/* ─── Drag Ghost ─────────────────────────────────────────────────── */
export function DragGhost({ items, visible }) {
  const posRef = useRef({ x: -200, y: -200 });
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const rafRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      posRef.current = { x: e.clientX - 12, y: e.clientY - 12 };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPos({ ...posRef.current });
          rafRef.current = null;
        });
      }
    };
    document.addEventListener('pointermove', handler);
    return () => {
      document.removeEventListener('pointermove', handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  if (!visible || items.length === 0) return null;

  const displayItems = items.slice(0, 3);
  const opacities = [1, 0.5, 0.3];

  return ReactDOM.createPortal(
    <div
      className="drag-ghost-root"
      style={{ left: pos.x, top: pos.y }}
    >
      {[...displayItems].reverse().map((item, i) => {
        const realIdx = displayItems.length - 1 - i;
        return (
          <div
            key={item.id || i}
            className="drag-ghost-card"
            style={{
              transform: `translate(${realIdx * 4}px, ${realIdx * 3}px)`,
              opacity: opacities[realIdx],
              zIndex: realIdx,
            }}
          >
            <span className="drag-ghost-icon">
              {item.type === 'chat' ? <FileText size={16} color="var(--accent)" /> : <Folder size={16} color="#f59e0b" />}
            </span>
            <span className="drag-ghost-name">{item.name}</span>
          </div>
        );
      })}
      {items.length > 1 && (
        <div className="drag-ghost-count">×{items.length}</div>
      )}
    </div>,
    document.body
  );
}

/* ─── Bin Drop Zone ──────────────────────────────────────────────── */
export function BinDropZone({ onDrop }) {
  const { state } = useInteraction();
  const [hovering, setHovering] = useState(false);

  if (!state.binVisible) return null;

  return ReactDOM.createPortal(
    <div
      className={`bin-drop-zone ${hovering ? 'bin-hovering' : ''}`}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onPointerUp={() => { onDrop(); setHovering(false); }}
    >
      <div className="bin-icon-wrap">
        <Trash2 size={hovering ? 30 : 26} className="bin-icon" />
      </div>
      <span className="bin-label">{hovering ? 'Release to delete' : 'Delete'}</span>
    </div>,
    document.body
  );
}

/* ─── Undo Toast ─────────────────────────────────────────────────── */
export function UndoToast({ onUndo }) {
  const { state, dispatch } = useInteraction();
  const { toastVisible, toastMessage } = state;
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (!toastVisible) return;
    // Reset progress bar by bumping the key
    setAnimKey(k => k + 1);
    const timer = setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 10000);
    return () => clearTimeout(timer);
  }, [toastVisible, toastMessage]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && toastVisible) {
        e.preventDefault();
        onUndo?.();
        dispatch({ type: 'POP_UNDO' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toastVisible, onUndo]);

  if (!toastVisible) return null;

  const isMac = navigator.platform.includes('Mac');

  return ReactDOM.createPortal(
    <div className="undo-toast">
      <div className="undo-toast-content">
        <span className="undo-toast-message">{toastMessage}</span>
        <span className="undo-shortcut">{isMac ? '⌘Z' : 'Ctrl+Z'}</span>
      </div>
      <div className="undo-progress-track">
        <div key={animKey} className="undo-progress-fill" />
      </div>
    </div>,
    document.body
  );
}

/* ─── Checkbox Action Bar ────────────────────────────────────────── */
export function CheckboxActionBar({ onDelete }) {
  const { state, dispatch } = useInteraction();
  if (!state.isCheckboxMode) return null;
  const count = state.checkedItems.size;

  return ReactDOM.createPortal(
    <div className="checkbox-action-bar">
      <span>{count} selected</span>
      <button
        className="action-bar-delete"
        onClick={onDelete}
        disabled={count === 0}
      >
        <Trash2 size={14} /> Delete
      </button>
      <button
        className="action-bar-cancel"
        onClick={() => dispatch({ type: 'EXIT_CHECKBOX_MODE' })}
      >
        Cancel
      </button>
    </div>,
    document.body
  );
}

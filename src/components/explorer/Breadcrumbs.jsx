import React, { useMemo } from 'react';
import { useExplorer } from '../../context/ExplorerContext';
import { ChevronRight, Home, Search, FolderOpen } from 'lucide-react';
import './Explorer.css';

export default function Breadcrumbs() {
  const { state, dispatch } = useExplorer();
  
  const path = useMemo(() => {
    let currentId = state.selectedFolderId;
    const items = [];
    while (currentId) {
      const node = state.tree.find(n => n.id === currentId);
      if (!node) break;
      items.unshift(node);
      currentId = node.parentId;
    }
    return items;
  }, [state.selectedFolderId, state.tree]);

  return (
    <div className="explorer-header-area">
      <div className="explorer-breadcrumbs">
        {path.map((node, index) => (
          <React.Fragment key={node.id}>
            <button 
              className={`crumb-btn ${index === path.length - 1 ? 'crumb-active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SELECTED_FOLDER', payload: node.id })}
            >
              {node.id === 'root' ? <Home size={14} /> : <FolderOpen size={14} />}
              {node.name}
            </button>
            {index < path.length - 1 && <ChevronRight size={14} className="crumb-sep" />}
          </React.Fragment>
        ))}
      </div>
      <div className="explorer-search-bar glass-input">
        <Search size={16} />
        <input 
          placeholder="Search chats and folders..." 
          value={state.searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        />
      </div>
    </div>
  );
}

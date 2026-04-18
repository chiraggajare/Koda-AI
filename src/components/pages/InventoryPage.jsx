import React, { useRef } from 'react';
import { Package, Upload, Trash2, FileText, Image, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import './InventoryPage.css';

function fileIcon(type) {
  if (type?.startsWith('image/')) return <Image size={18} />;
  return <FileText size={18} />;
}

export default function InventoryPage() {
  const { state, dispatch } = useChat();
  const fileRef = useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const processFiles = (files) => {
    Array.from(files).forEach(f => {
      dispatch({
        type: 'ADD_INVENTORY_ITEM',
        payload: {
          id: `inv_${Date.now()}_${Math.random()}`,
          name: f.name,
          type: f.type,
          size: f.size,
          uploadedAt: Date.now(),
        },
      });
    });
  };

  const handleUpload = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const fmt = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div className="inv-header-left">
          <Package size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="inv-title">My Inventory</h1>
            <p className="inv-subtitle">All your uploaded images and documents</p>
          </div>
        </div>
        <button className="upload-btn" onClick={() => fileRef.current?.click()} id="inventory-upload-btn">
          <Upload size={14} /> Upload Files
        </button>
        <input ref={fileRef} type="file" multiple hidden onChange={handleUpload} />
      </div>

      {state.inventory.length === 0 ? (
        <label 
          className={`inv-dropzone ${isDragging ? 'dragging' : ''} anim-fade-in`} 
          htmlFor="inv-upload-hidden"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <Package size={36} style={{ color: 'var(--accent)', opacity: 0.5 }} />
          <h2>{isDragging ? 'Drop files here' : 'No files yet'}</h2>
          <p>Upload documents and images to use them in your chats and seeds</p>
          <span className="upload-cta">Click or drag & drop</span>
          <input id="inv-upload-hidden" type="file" multiple hidden onChange={handleUpload} />
        </label>
      ) : (
        <div className="inventory-grid">
          {state.inventory.map(item => (
            <div key={item.id} className="inv-card glass-card anim-fade-in-up">
              <div className="inv-card-icon">{fileIcon(item.type)}</div>
              <div className="inv-card-info">
                <div className="inv-card-name">{item.name}</div>
                <div className="inv-card-meta">
                  {fmt(item.size)} · {new Date(item.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                className="inv-delete-btn"
                onClick={() => dispatch({ type: 'REMOVE_INVENTORY_ITEM', payload: item.id })}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

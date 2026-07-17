import { useState } from 'react';
import { useEditMode } from './edit-context.jsx';

/**
 * Editable wrapper for content - shows edit button on hover when in edit mode
 */
export function EditableContent({ 
    id, 
    type, // 'announcement', 'text', 'section', etc.
    children, 
    onEdit,
    style = {}
}) {
    const { isEditMode } = useEditMode();
    const [showEditHint, setShowEditHint] = useState(false);

    if (!isEditMode) {
        return <div style={style}>{children}</div>;
    }

    return (
        <div
            style={{
                position: 'relative',
                ...style,
            }}
            onMouseEnter={() => setShowEditHint(true)}
            onMouseLeave={() => setShowEditHint(false)}
        >
            {children}
            {showEditHint && (
                <button
                    onClick={() => onEdit(id)}
                    className="edit-hover-btn"
                    title={`Edit ${type}`}
                >
                    ✎ Edit
                </button>
            )}
        </div>
    );
}

/**
 * Quick edit form for announcements - appears as modal
 */
export function AnnouncementQuickEdit({ slide, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        title: slide.title,
        content: slide.content,
        active: slide.active
    });

    function handleSave() {
        onSave({
            ...slide,
            title: formData.title,
            content: formData.content,
            active: formData.active
        });
    }

    return (
        <div className="quick-edit-overlay">
            <div className="quick-edit-modal">
                <h3>Edit Announcement</h3>
                
                <label>
                    <span>Title</span>
                    <input 
                        type="text" 
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Announcement title"
                    />
                </label>

                <label>
                    <span>Content</span>
                    <textarea
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Announcement message"
                        rows="4"
                    />
                </label>

                <label className="checkbox-label">
                    <input 
                        type="checkbox"
                        checked={formData.active}
                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <span>Active (Published)</span>
                </label>

                <div className="quick-edit-actions">
                    <button onClick={handleSave} className="quick-edit-save">
                        ✓ Save Changes
                    </button>
                    <button onClick={onCancel} className="quick-edit-cancel">
                        ✕ Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Quick edit for text content
 */
export function TextQuickEdit({ content, onSave, onCancel, title = 'Edit Content' }) {
    const [text, setText] = useState(content);

    return (
        <div className="quick-edit-overlay">
            <div className="quick-edit-modal" style={{ maxWidth: '600px' }}>
                <h3>{title}</h3>
                
                <label>
                    <span>Content</span>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Edit content..."
                        rows="6"
                        style={{ fontFamily: 'inherit' }}
                    />
                </label>

                <div className="quick-edit-actions">
                    <button onClick={() => onSave(text)} className="quick-edit-save">
                        ✓ Save
                    </button>
                    <button onClick={onCancel} className="quick-edit-cancel">
                        ✕ Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Edit toggle button for navbar
 */
export function EditModeToggle() {
    const { isEditMode, toggleEditMode } = useEditMode();

    return (
        <button
            onClick={toggleEditMode}
            className="edit-mode-toggle"
            title={isEditMode ? 'Click to disable edit mode' : 'Click to enable edit mode'}
        >
            {isEditMode ? (
                <>
                    <span className="edit-mode-indicator">●</span>
                    Edit Mode: ON
                </>
            ) : (
                <>
                    <span>✎</span>
                    Edit Mode
                </>
            )}
        </button>
    );
}

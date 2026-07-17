import { createContext, useContext, useState } from 'react';

/**
 * EditMode context - tracks if admin is in edit mode
 */
export const EditModeContext = createContext({
    isEditMode: false,
    toggleEditMode: () => {},
});

export function useEditMode() {
    return useContext(EditModeContext);
}

export function EditModeProvider({ children, isLoggedIn }) {
    const [isEditMode, setIsEditMode] = useState(false);

    const toggleEditMode = () => {
        setIsEditMode(prev => !prev);
    };

    // Only allow edit mode if logged in
    const actualEditMode = isLoggedIn && isEditMode;

    return (
        <EditModeContext.Provider value={{ isEditMode: actualEditMode, toggleEditMode }}>
            {children}
        </EditModeContext.Provider>
    );
}

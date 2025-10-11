import { create } from 'zustand';

const useConversation = create((set) => ({
    selectedConversation: null,
    setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
    messages: [],
    setMessages: (messages) => set({ messages }),
    
    // NEW: A Set to store the IDs of all users currently typing
    typingUsers: new Set(),
    
    // NEW: Action to add a user to the typing Set
    addTypingUser: (userId) => set((state) => ({
        typingUsers: new Set(state.typingUsers).add(userId)
    })),

    // NEW: Action to remove a user from the typing Set
    removeTypingUser: (userId) => set((state) => {
        const newTypingUsers = new Set(state.typingUsers);
        newTypingUsers.delete(userId);
        return { typingUsers: newTypingUsers };
    }),
}));

export default useConversation;
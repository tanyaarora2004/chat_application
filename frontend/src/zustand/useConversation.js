import { create } from 'zustand';

const useConversation = create((set) => ({
    selectedConversation: null,
    setSelectedConversation: (selectedConversation) => set({ selectedConversation }),

    messages: [],
    setMessages: (updater) =>
        set((state) => ({
            messages: typeof updater === 'function'
                ? [...updater(state.messages)] // ensures new reference always
                : [...updater],
        })),

    typingUsers: new Set(),
    addTypingUser: (userId) =>
        set((state) => ({
            typingUsers: new Set(state.typingUsers).add(userId),
        })),

    removeTypingUser: (userId) =>
        set((state) => {
            const newTypingUsers = new Set(state.typingUsers);
            newTypingUsers.delete(userId);
            return { typingUsers: newTypingUsers };
        }),

    updateMessage: (updatedMessage) =>
        set((state) => {
            console.log('🔄 Updating message:', updatedMessage._id, 'status:', updatedMessage.status);
            if (updatedMessage.deletedForEveryone || updatedMessage.deletedBy) {
                console.log('🗑️ Message deletion update:', {
                    id: updatedMessage._id,
                    deletedForEveryone: updatedMessage.deletedForEveryone,
                    deletedBy: updatedMessage.deletedBy
                });
            }
            const newMessages = [...state.messages.map((msg) =>
                msg._id === updatedMessage._id ? { ...updatedMessage } : msg
            )];
            console.log('🔄 New messages array created, length:', newMessages.length);
            return { messages: newMessages };
        }),

    setAllMessagesAsSeenBy: (receiverId) => {
        console.log("📖 setAllMessagesAsSeenBy called for receiverId:", receiverId);
        set((state) => {
            // Update messages where current user is sender and receiverId is the receiver
            const updatedMessages = [...state.messages.map((msg) =>
                msg.receiverId === receiverId && msg.status !== 'seen'
                    ? { ...msg, status: 'seen' }
                    : msg
            )];
            const seenCount = updatedMessages.filter(m => m.status === "seen" && m.receiverId === receiverId).length;
            console.log("📖 Messages updated to seen for receiverId:", receiverId, "count:", seenCount);
            return { messages: updatedMessages };
        });
    },
}));

export default useConversation;
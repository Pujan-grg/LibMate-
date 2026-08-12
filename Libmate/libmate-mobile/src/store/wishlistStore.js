import { create } from 'zustand';

const useWishlistStore = create((set, get) => ({
  bookIds: new Set(),
  loaded: false,

  setWishlist: (books) =>
    set({ bookIds: new Set(books.map((b) => b.book_id)), loaded: true }),

  addBook: (bookId) =>
    set((state) => ({ bookIds: new Set([...state.bookIds, bookId]) })),

  removeBook: (bookId) =>
    set((state) => {
      const next = new Set(state.bookIds);
      next.delete(bookId);
      return { bookIds: next };
    }),

  isInWishlist: (bookId) => get().bookIds.has(bookId),

  reset: () => set({ bookIds: new Set(), loaded: false }),
}));

export default useWishlistStore;

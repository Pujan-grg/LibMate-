import client from './client';

export const getBooks = (params) => client.get('/books', { params });
export const getBook = (id) => client.get(`/books/${id}`);
export const getGenres = () => client.get('/books/genres');

export const addReview = (bookId, data) =>
  client.post(`/books/${bookId}/reviews`, data);
export const updateReview = (bookId, reviewId, data) =>
  client.put(`/books/${bookId}/reviews/${reviewId}`, data);
export const deleteReview = (bookId, reviewId) =>
  client.delete(`/books/${bookId}/reviews/${reviewId}`);

export const requestBook = (data) => client.post('/books/request', data);

import client from './client';

export const borrowBook = (bookId) =>
  client.post(`/borrowings/borrow/${bookId}`);

export const requestRenewal = (borrowId) =>
  client.post(`/borrowings/${borrowId}/renew`);

export const returnBook = (borrowId) =>
  client.post(`/borrowings/${borrowId}/return`);

export const payFine = (borrowId, paymentMethod = 'card') =>
  client.post(`/borrowings/${borrowId}/pay-fine`, { payment_method: paymentMethod });

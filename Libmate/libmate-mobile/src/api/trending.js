import client from './client';

export const getTrending = (limit = 10) =>
  client.get('/trending', { params: { limit } });

export const getAllTrending = (page = 1, perPage = 20) =>
  client.get('/trending/all', { params: { page, per_page: perPage } });

export const getNewArrivals = (limit = 6) =>
  client.get('/new-arrivals/latest', { params: { limit } });

export const getAllNewArrivals = (page = 1, perPage = 20) =>
  client.get('/new-arrivals', { params: { page, per_page: perPage } });

export const getStats = () => client.get('/trending/stats');

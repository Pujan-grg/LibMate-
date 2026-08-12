import client from './client';

export const getRecommendations = (limit = 10) =>
  client.get('/recommendations', { params: { limit } });

export const refreshRecommendations = () =>
  client.post('/recommendations/refresh');

export const hasRecommendations = () =>
  client.get('/recommendations/has-recommendations');

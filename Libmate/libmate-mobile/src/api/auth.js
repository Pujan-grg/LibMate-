import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password });

export const register = (data) =>
  client.post('/auth/register', data);

export const getMe = () =>
  client.get('/auth/me');

export const changePassword = (old_password, new_password) =>
  client.post('/auth/change-password', { old_password, new_password });

export const forgotPassword = (email) =>
  client.post('/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  client.post('/auth/reset-password', { token, password });

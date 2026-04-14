import api from './axios';

export const getExchangeRates = async (base = 'USD') => {
  try {
    const response = await api.get(`/rates?base=${base}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

import api from './axios';

export const getTripBalances = async (tripId) => {
    try {
        const response = await api.get(`/trips/${tripId}/balances`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getSettlementSuggestions = async (tripId) => {
    try {
        const response = await api.get(`/trips/${tripId}/settlement-suggestions`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getTripSettlementsHistory = async (tripId) => {
    try {
        const response = await api.get(`/trips/${tripId}/settlements`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};
export const recordSettlement = async (tripId, data) => {
    try {
        const response = await api.post(`/trips/${tripId}/settlements`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

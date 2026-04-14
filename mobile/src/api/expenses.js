import api from './axios';

export const createExpense = async (tripId, expenseData) => {
    try {
        const response = await api.post(`/trips/${tripId}/expenses`, expenseData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getTripExpenses = async (tripId) => {
    try {
        const response = await api.get(`/trips/${tripId}/expenses`);
        return response.data; // The backend returns array directly in rows
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getExpenseById = async (tripId, expenseId) => {
    try {
        // Note: API route is /trips/:tripId/expenses/:expenseId
        const response = await api.get(`/trips/${tripId}/expenses/${expenseId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const extractReceipt = async (formData) => {
    try {
        const response = await api.post('/ai/extract-receipt', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const extractVoiceExpense = async (audioUri, audioFilename, memberNames) => {
    try {
        const formData = new FormData();
        formData.append('audio', {
            uri: audioUri,
            name: audioFilename || 'recording.m4a',
            type: 'audio/m4a',
        });
        formData.append('members', JSON.stringify(memberNames || []));

        const response = await api.post('/ai/voice-expense', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const deleteExpense = async (tripId, expenseId) => {
    try {
        const response = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

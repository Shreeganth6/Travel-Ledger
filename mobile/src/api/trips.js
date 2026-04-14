import api from './axios';

export const createTrip = async (tripData) => {
    try {
        const response = await api.post('/trips', tripData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getTrips = async () => {
    try {
        const response = await api.get('/trips');
        return response.data.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getTripById = async (tripId) => {
    try {
        const response = await api.get(`/trips/${tripId}`);
        return response.data.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getTripSummary = async (tripId) => {
    try {
        const response = await api.get(`/trips/${tripId}/summary`);
        console.log('getTripSummary API Response:', JSON.stringify(response.data, null, 2));

        // Backend returns: { success: true, data: { trip: {...}, user_role: '...', balances: [...], ... } }
        if (response.data && response.data.data) {
            return response.data.data;
        }

        // Fallback if structure is different
        console.warn('Unexpected response structure:', response.data);
        return response.data;
    } catch (error) {
        console.error('getTripSummary Error:', error);
        throw error.response?.data?.message || error.message;
    }
};

export const updateTripStatus = async (tripId, status) => {
    try {
        const response = await api.put(`/trips/${tripId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

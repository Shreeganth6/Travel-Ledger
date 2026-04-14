import api from './axios';

export const searchUsers = async (email) => {
    try {
        const response = await api.get('/auth/search', { params: { email } });
        return response.data.users;
    } catch (error) {
        console.log('Search user error', error);
        return [];
    }
};

export const addMember = async (tripId, userId) => {
    try {
        const response = await api.post(`/trips/${tripId}/members`, { user_id: userId });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

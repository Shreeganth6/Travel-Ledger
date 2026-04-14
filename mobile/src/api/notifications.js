import api from './axios';

export const getNotifications = async () => {
    try {
        const response = await api.get('/notifications');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getUnreadCount = async () => {
    try {
        const response = await api.get('/notifications/unread-count');
        return response.data.count;
    } catch (error) {
        return 0; // Fail silently for badge counts
    }
};

export const markNotificationRead = async (notificationId) => {
    try {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const markAllRead = async () => {
    try {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

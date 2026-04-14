import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await AsyncStorage.getItem('userToken');
            let userInfo = await AsyncStorage.getItem('userInfo');

            if (userToken) {
                setUserToken(userToken);
                setUserInfo(JSON.parse(userInfo));
            }
            setIsLoading(false);
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            console.log('Login Response:', response.data);

            if (response.data.success) {
                let userUserInfo = response.data.user;
                let token = response.data.token;

                setUserInfo(userUserInfo);
                setUserToken(token);

                await AsyncStorage.setItem('userInfo', JSON.stringify(userUserInfo));
                await AsyncStorage.setItem('userToken', token);
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.log('Login error', error);
            throw error.response?.data?.message || error.message || 'An error occurred during login';
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (fullName, email, password, phoneNumber) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/signup', {
                full_name: fullName,
                email,
                password,
                phone_number: phoneNumber,
            });

            console.log('Register Response:', response.data);

            if (response.data.success) {
                // Provide feedback or auto-login? For now just return true
                return true;
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }

        } catch (error) {
            console.log('Register error', error);
            throw error.response?.data?.message || error.message || 'An error occurred during registration';
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (fullName, phoneNumber) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/update-profile', {
                full_name: fullName,
                phone_number: phoneNumber,
            });

            if (response.data.success) {
                // Update local userInfo
                const newUserInfo = { ...userInfo, name: fullName, phone: phoneNumber };
                setUserInfo(newUserInfo);
                await AsyncStorage.setItem('userInfo', JSON.stringify(newUserInfo));
                return true;
            }
            throw new Error(response.data.message || 'Profile update failed');
        } catch (error) {
            console.log('Update Profile error', error);
            throw error.response?.data?.message || error.message || 'An error occurred during update';
        } finally {
            setIsLoading(false);
        }
    };

    const getProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            if (response.data.success) {
                const user = response.data.user;
                const mappedUser = {
                    id: user.user_id,
                    name: user.full_name,
                    email: user.email,
                    phone: user.phone_number
                };
                setUserInfo(mappedUser);
                await AsyncStorage.setItem('userInfo', JSON.stringify(mappedUser));
                return mappedUser;
            }
        } catch (error) {
            console.log('Get Profile error', error);
        }
        return userInfo;
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const logout = () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        AsyncStorage.removeItem('userToken');
        AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{
            login,
            logout,
            isLoading,
            userToken,
            userInfo,
            register,
            updateProfile,
            getProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

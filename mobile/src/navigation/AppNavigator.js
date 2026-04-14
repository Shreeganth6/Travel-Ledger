import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import AuthStack from './AuthStack';
import TabNavigator from './TabNavigator';
import { COLORS } from '../constants/theme';

const AppNavigator = () => {
    const { isLoading, userToken } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {userToken ? <TabNavigator /> : <AuthStack />}
        </NavigationContainer>
    );
};

export default AppNavigator;

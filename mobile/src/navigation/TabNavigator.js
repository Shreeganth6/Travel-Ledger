import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useIsFocused, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { HomeStack, TripsStack } from './MainStack';
import AIChatScreen from '../screens/AIChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { COLORS, SHADOWS } from '../constants/theme';
import { getUnreadCount } from '../api/notifications';

const Tab = createBottomTabNavigator();

// Small badge component
const Badge = ({ count }) => {
    if (!count || count <= 0) return null;
    return (
        <View style={{
            position: 'absolute',
            top: -4,
            right: -8,
            backgroundColor: '#ef4444',
            borderRadius: 9,
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
        }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {count > 99 ? '99+' : count}
            </Text>
        </View>
    );
};

// Wrapper to poll unread count whenever the tab is focused
const BellIcon = ({ focused, color, size }) => {
    const [unread, setUnread] = useState(0);
    const isFocused = useIsFocused();

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            const c = await getUnreadCount();
            if (mounted) setUnread(Number(c) || 0);
        };
        fetch();
        const interval = setInterval(fetch, 30000); // refresh every 30s
        return () => { mounted = false; clearInterval(interval); };
    }, [isFocused]);

    return (
        <View>
            <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={size}
                color={color}
            />
            <Badge count={unread} />
        </View>
    );
};

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: ((route) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? '';
                    if (routeName === 'AddExpense' || routeName === 'ExpenseDetails') {
                        return { display: 'none' };
                    }
                    return {
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        right: 20,
                        elevation: 0,
                        backgroundColor: 'rgba(17, 24, 39, 0.92)',
                        borderRadius: 20,
                        height: 70,
                        borderTopWidth: 0,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        ...SHADOWS.medium,
                    };
                })(route),
                tabBarIcon: ({ focused, color, size }) => {
                    if (route.name === 'Home') {
                        return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
                    } else if (route.name === 'Trips') {
                        return <Ionicons name={focused ? 'airplane' : 'airplane-outline'} size={size} color={color} />;
                    } else if (route.name === 'AI Chat') {
                        return <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />;
                    } else if (route.name === 'Notifications') {
                        return <BellIcon focused={focused} color={color} size={size} />;
                    } else if (route.name === 'Profile') {
                        return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
                    }
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarHideOnKeyboard: true,
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Trips" component={TripsStack} />
            <Tab.Screen name="AI Chat" component={AIChatScreen} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default TabNavigator;

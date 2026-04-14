import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import TripListScreen from '../screens/TripListScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import SettlementScreen from '../screens/SettlementScreen';
import MembersScreen from '../screens/MembersScreen';
import TripMetadataScreen from '../screens/TripMetadataScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ExpenseDetailsScreen from '../screens/ExpenseDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import EditProfileScreen from '../screens/EditProfileScreen';


const Stack = createNativeStackNavigator();

// Common screens that both stacks need so navigation doesn't force a tab switch
const commonScreens = (
    <>
        <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
        <Stack.Screen name="Expenses" component={ExpenseListScreen} />
        <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="Settlement" component={SettlementScreen} />
        <Stack.Screen name="Members" component={MembersScreen} />
        <Stack.Screen name="TripMetadata" component={TripMetadataScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />

    </>
);

export const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        {commonScreens}
    </Stack.Navigator>
);

export const TripsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TripsList" component={TripListScreen} />
        {commonScreens}
    </Stack.Navigator>
);


import React, { useState, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';

// Create Auth Context
export const AuthContext = createContext();

// Import screens
import HomeScreen from './screens/HomeScreen';
import RunScreen from './screens/RunScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import FriendsScreen from './screens/FriendsScreen';
import HelpScreen from './screens/HelpScreen';
import GoalsScreen from './screens/GoalsScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import ChallengesScreen from './screens/ChallengesScreen';
import ChallengeDetailScreen from './screens/ChallengeDetailScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Run') {
                        iconName = focused ? 'play-circle' : 'play-circle-outline';
                    } else if (route.name === 'History') {
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF6B6B',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
            <Tab.Screen name="Run" component={RunScreen} options={{ title: '러닝' }} />
            <Tab.Screen name="History" component={HistoryScreen} options={{ title: '기록' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '프로필' }} />
        </Tab.Navigator>
    );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config/api';

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // 토큰이 있으면 유효성 검증 (타임아웃 설정)
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

                    const response = await fetch(`${API_URL}/api/auth/users/me`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        setIsLoggedIn(true);
                    } else {
                        // 토큰이 유효하지 않으면 제거
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('userEmail');
                        await AsyncStorage.removeItem('username');
                        setIsLoggedIn(false);
                    }
                } catch (error) {
                    console.error('토큰 검증 실패:', error.message);
                    // 네트워크 에러 시 토큰은 유지하고 로그인 상태로 진행
                    // (오프라인에서도 앱 사용 가능하도록)
                    if (error.name === 'AbortError') {
                        console.log('토큰 검증 타임아웃 - 로그인 상태 유지');
                        setIsLoggedIn(true);
                    } else {
                        setIsLoggedIn(false);
                    }
                }
            } else {
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error('로그인 상태 확인 실패:', error);
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('username');
            setIsLoggedIn(false);
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <ErrorBoundary>
            <AuthContext.Provider value={{ handleLogout }}>
                <NavigationContainer>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        {!isLoggedIn ? (
                            <>
                                <Stack.Screen name="Login">
                                    {props => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
                                </Stack.Screen>
                                <Stack.Screen name="Register">
                                    {props => <RegisterScreen {...props} onRegister={() => setIsLoggedIn(true)} />}
                                </Stack.Screen>
                            </>
                        ) : (
                            <>
                                <Stack.Screen name="Main" component={MainTabs} />
                                <Stack.Screen name="Settings" component={SettingsScreen} />
                                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                                <Stack.Screen name="Friends" component={FriendsScreen} />
                                <Stack.Screen name="Help" component={HelpScreen} />
                                <Stack.Screen name="Goals" component={GoalsScreen} />
                                <Stack.Screen name="Achievements" component={AchievementsScreen} />
                                <Stack.Screen name="Challenges" component={ChallengesScreen} />
                                <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
                                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                            </>
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </AuthContext.Provider>
        </ErrorBoundary>
    );
}

import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 알림 모듈 동적 import (웹에서는 사용 불가)
let Notifications = null;
if (Platform.OS !== 'web') {
    try {
        Notifications = require('expo-notifications');
        // 알림 설정
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    } catch (error) {
        console.log('Notifications not available on this platform');
    }
}

export default function NotificationsScreen({ navigation }) {
    const [notifications, setNotifications] = useState({
        runReminder: true,
        goalAchievement: true,
        friendActivity: false,
        weatherAlert: true,
        weeklyReport: true,
    });
    const [loading, setLoading] = useState(true);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const notificationItems = [
        { key: 'runReminder', title: '러닝 알림', subtitle: '매일 러닝 시간을 알려드려요', icon: 'alarm-outline' },
        { key: 'goalAchievement', title: '목표 달성', subtitle: '목표를 달성하면 알려드려요', icon: 'trophy-outline' },
        { key: 'friendActivity', title: '친구 활동', subtitle: '친구의 러닝 활동을 알려드려요', icon: 'people-outline' },
        { key: 'weatherAlert', title: '날씨 알림', subtitle: '러닝하기 좋은 날씨를 알려드려요', icon: 'partly-sunny-outline' },
        { key: 'weeklyReport', title: '주간 리포트', subtitle: '매주 러닝 통계를 보내드려요', icon: 'stats-chart-outline' },
    ];

    useEffect(() => {
        loadNotificationSettings();
        checkNotificationPermission();
    }, []);

    const checkNotificationPermission = async () => {
        // 웹 환경이거나 Notifications가 없으면 권한 허용으로 간주
        if (Platform.OS === 'web' || !Notifications) {
            setPermissionGranted(true);
            return;
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            
            setPermissionGranted(finalStatus === 'granted');
            
            if (finalStatus !== 'granted') {
                Alert.alert(
                    '알림 권한 필요',
                    '알림을 받으려면 알림 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
                    [{ text: '확인' }]
                );
            }
        } catch (error) {
            console.error('알림 권한 확인 실패:', error);
            setPermissionGranted(true); // 오류 시 권한 허용으로 간주
        }
    };

    const loadNotificationSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('notification_settings');
            if (savedSettings) {
                setNotifications(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('알림 설정 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveNotificationSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
        } catch (error) {
            console.error('알림 설정 저장 실패:', error);
            Alert.alert('오류', '설정 저장에 실패했습니다.');
        }
    };

    const toggleNotification = async (key) => {
        if (!permissionGranted && Platform.OS !== 'web' && Notifications) {
            Alert.alert(
                '알림 권한 필요',
                '알림을 활성화하려면 먼저 알림 권한을 허용해주세요.',
                [
                    { text: '취소', style: 'cancel' },
                    { 
                        text: '설정으로 이동', 
                        onPress: () => {
                            if (Notifications) {
                                Notifications.requestPermissionsAsync();
                            }
                        }
                    }
                ]
            );
            return;
        }

        const newSettings = {
            ...notifications,
            [key]: !notifications[key]
        };
        
        setNotifications(newSettings);
        await saveNotificationSettings(newSettings);

        // 알림 활성화 시 피드백
        if (newSettings[key]) {
            const item = notificationItems.find(i => i.key === key);
            Alert.alert('알림 활성화', `${item.title} 알림이 활성화되었습니다.`);
        }
    };

    const toggleAllNotifications = async (value) => {
        if (value && !permissionGranted && Platform.OS !== 'web' && Notifications) {
            Alert.alert(
                '알림 권한 필요',
                '알림을 활성화하려면 먼저 알림 권한을 허용해주세요.',
                [
                    { text: '취소', style: 'cancel' },
                    { 
                        text: '설정으로 이동', 
                        onPress: () => {
                            if (Notifications) {
                                Notifications.requestPermissionsAsync();
                            }
                        }
                    }
                ]
            );
            return;
        }

        const newSettings = {
            runReminder: value,
            goalAchievement: value,
            friendActivity: value,
            weatherAlert: value,
            weeklyReport: value,
        };
        
        setNotifications(newSettings);
        await saveNotificationSettings(newSettings);
        
        Alert.alert(
            value ? '모든 알림 활성화' : '모든 알림 비활성화',
            value ? '모든 알림이 활성화되었습니다.' : '모든 알림이 비활성화되었습니다.'
        );
    };

    const allEnabled = Object.values(notifications).every(v => v);
    const allDisabled = Object.values(notifications).every(v => !v);

    return (
        <LinearGradient
            colors={['#FF6B6B', '#FFE66D', '#4ECDC4']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>알림 설정</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={styles.loadingText}>설정 불러오는 중...</Text>
                    </View>
                ) : (
                    <ScrollView 
                        style={styles.content} 
                        contentContainerStyle={{ paddingBottom: 30 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* 권한 상태 표시 */}
                        {!permissionGranted && (
                            <View style={styles.warningCard}>
                                <Ionicons name="warning-outline" size={24} color="#FFA726" />
                                <View style={styles.warningText}>
                                    <Text style={styles.warningTitle}>알림 권한이 필요합니다</Text>
                                    <Text style={styles.warningSubtitle}>
                                        알림을 받으려면 권한을 허용해주세요
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* 전체 토글 */}
                        <View style={styles.masterToggle}>
                            <View style={styles.masterToggleLeft}>
                                <Ionicons name="notifications" size={24} color="#FFF" />
                                <Text style={styles.masterToggleText}>모든 알림</Text>
                            </View>
                            <View style={styles.masterToggleButtons}>
                                {!allEnabled && (
                                    <TouchableOpacity
                                        style={styles.toggleAllButton}
                                        onPress={() => toggleAllNotifications(true)}
                                    >
                                        <Text style={styles.toggleAllButtonText}>모두 켜기</Text>
                                    </TouchableOpacity>
                                )}
                                {!allDisabled && (
                                    <TouchableOpacity
                                        style={[styles.toggleAllButton, styles.toggleAllButtonOff]}
                                        onPress={() => toggleAllNotifications(false)}
                                    >
                                        <Text style={styles.toggleAllButtonText}>모두 끄기</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* 개별 알림 설정 */}
                        {notificationItems.map((item, index) => (
                        <View 
                            key={item.key} 
                            style={[
                                styles.notificationItem,
                                index === 0 && styles.firstItem,
                                index === notificationItems.length - 1 && styles.lastItem
                            ]}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name={item.icon} size={24} color="#FF6B6B" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.subtitle}>{item.subtitle}</Text>
                            </View>
                            <Switch
                                value={notifications[item.key]}
                                onValueChange={() => toggleNotification(item.key)}
                                trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
                                thumbColor="#FFF"
                            />
                        </View>
                    ))}

                        {/* 도움말 */}
                        <View style={styles.helpCard}>
                            <Ionicons name="information-circle-outline" size={20} color="rgba(255, 255, 255, 0.8)" />
                            <Text style={styles.helpText}>
                                알림 설정은 자동으로 저장됩니다. 알림을 받지 못하는 경우 기기 설정에서 알림 권한을 확인해주세요.
                            </Text>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
        padding: 20,
        paddingTop: 10,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 20,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    firstItem: {
        marginTop: 0,
    },
    lastItem: {
        marginBottom: 20,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#FFF',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 167, 38, 0.2)',
        padding: 15,
        marginBottom: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 167, 38, 0.4)',
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
    },
    warningTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    warningSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    masterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: 20,
        marginBottom: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    masterToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    masterToggleText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 12,
    },
    masterToggleButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    toggleAllButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    toggleAllButtonOff: {
        backgroundColor: 'rgba(255, 107, 107, 0.9)',
    },
    toggleAllButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 15,
        marginTop: 10,
        marginBottom: 30,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    helpText: {
        flex: 1,
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginLeft: 10,
        lineHeight: 18,
    },
});

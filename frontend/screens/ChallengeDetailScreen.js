import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function ChallengeDetailScreen({ route, navigation }) {
    const { challengeId } = route.params;
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChallengeDetail();
    }, []);

    const loadChallengeDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/challenges/${challengeId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setChallenge(data);
            } else {
                Alert.alert('오류', '챌린지 정보를 불러오는데 실패했습니다.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('챌린지 상세 로드 실패:', error);
            Alert.alert('오류', '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getGoalTypeText = (type) => {
        return type === 'distance' ? '거리' : '시간';
    };

    const getGoalUnit = (type) => {
        return type === 'distance' ? 'km' : '분';
    };

    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    if (loading) {
        return (
            <LinearGradient colors={['#FF6B6B', '#FFE66D', '#4ECDC4']} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFF" />
                </View>
            </LinearGradient>
        );
    }

    if (!challenge) return null;

    const daysRemaining = getDaysRemaining(challenge.end_date);
    const isActive = daysRemaining > 0;

    return (
        <LinearGradient colors={['#FF6B6B', '#FFE66D', '#4ECDC4']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>챌린지 상세</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <View style={styles.titleRow}>
                            <Text style={styles.challengeName}>{challenge.name}</Text>
                            {isActive ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{daysRemaining}일 남음</Text>
                                </View>
                            ) : (
                                <View style={[styles.badge, styles.badgeInactive]}>
                                    <Text style={styles.badgeText}>종료됨</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.goalText}>
                            목표: {challenge.target_value} {getGoalUnit(challenge.challenge_type)} 달성하기
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>참가자 순위</Text>

                        {challenge.participants.map((participant, index) => (
                            <View key={participant.user_id} style={styles.participantRow}>
                                <View style={styles.rankContainer}>
                                    <Text style={styles.rankText}>{index + 1}</Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{participant.username}</Text>
                                    <Text style={styles.userProgress}>
                                        {participant.current_value.toFixed(1)} / {challenge.target_value} {getGoalUnit(challenge.challenge_type)}
                                    </Text>
                                </View>
                                {participant.current_value >= challenge.target_value && (
                                    <Ionicons name="medal" size={24} color="#FFD700" />
                                )}
                            </View>
                        ))}
                    </View>
                </ScrollView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    challengeName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    badge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    badgeInactive: {
        backgroundColor: '#999',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    goalText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
    },
    rankContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    userProgress: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
});

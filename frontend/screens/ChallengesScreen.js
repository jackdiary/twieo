import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function ChallengesScreen({ navigation }) {
    const [challenges, setChallenges] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    
    // 새 챌린지 입력
    const [challengeName, setChallengeName] = useState('');
    const [goalType, setGoalType] = useState('distance'); // distance, time
    const [targetValue, setTargetValue] = useState('');
    const [duration, setDuration] = useState('7'); // 일 단위
    const [selectedFriends, setSelectedFriends] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([loadChallenges(), loadFriends()]);
        setLoading(false);
    };

    const loadChallenges = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/challenges`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setChallenges(data);
            }
        } catch (error) {
            console.error('챌린지 로드 실패:', error);
        }
    };

    const loadFriends = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/friends/list`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setFriends(data);
            }
        } catch (error) {
            console.error('친구 목록 로드 실패:', error);
        }
    };

    const createChallenge = async () => {
        if (!challengeName.trim()) {
            Alert.alert('오류', '챌린지 이름을 입력해주세요.');
            return;
        }
        if (!targetValue || parseFloat(targetValue) <= 0) {
            Alert.alert('오류', '목표 값을 입력해주세요.');
            return;
        }
        if (selectedFriends.length === 0) {
            Alert.alert('오류', '최소 1명의 친구를 선택해주세요.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + parseInt(duration));

            const response = await fetch(`${API_URL}/api/challenges`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: challengeName,
                    goal_type: goalType,
                    target_value: parseFloat(targetValue),
                    end_date: endDate.toISOString(),
                    participant_ids: selectedFriends,
                }),
            });

            if (response.ok) {
                Alert.alert('성공', '챌린지가 생성되었습니다.');
                setModalVisible(false);
                resetForm();
                loadChallenges();
            } else {
                const error = await response.json();
                Alert.alert('오류', error.detail || '챌린지 생성 실패');
            }
        } catch (error) {
            console.error('챌린지 생성 실패:', error);
            Alert.alert('오류', '챌린지 생성 중 문제가 발생했습니다.');
        }
    };

    const resetForm = () => {
        setChallengeName('');
        setTargetValue('');
        setDuration('7');
        setSelectedFriends([]);
    };

    const toggleFriendSelection = (friendId) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
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

    const renderChallengeCard = (challenge) => {
        const daysRemaining = getDaysRemaining(challenge.end_date);
        const isActive = daysRemaining > 0;
        const myParticipant = challenge.participants.find(p => p.is_creator);
        const progress = myParticipant ? (myParticipant.current_value / challenge.target_value) * 100 : 0;

        return (
            <TouchableOpacity
                key={challenge.id}
                style={[styles.challengeCard, !isActive && styles.challengeCardInactive]}
                onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
            >
                <View style={styles.challengeHeader}>
                    <View style={styles.challengeTitleContainer}>
                        <Text style={styles.challengeName}>{challenge.name}</Text>
                        <View style={styles.challengeTypeBadge}>
                            <Text style={styles.challengeTypeText}>
                                {getGoalTypeText(challenge.goal_type)}
                            </Text>
                        </View>
                    </View>
                    {isActive ? (
                        <View style={styles.daysRemainingBadge}>
                            <Ionicons name="time-outline" size={14} color="#FFF" />
                            <Text style={styles.daysRemainingText}>{daysRemaining}일</Text>
                        </View>
                    ) : (
                        <View style={[styles.daysRemainingBadge, styles.completedBadge]}>
                            <Text style={styles.daysRemainingText}>종료</Text>
                        </View>
                    )}
                </View>

                <View style={styles.challengeGoal}>
                    <Text style={styles.challengeGoalText}>
                        목표: {challenge.target_value} {getGoalUnit(challenge.goal_type)}
                    </Text>
                    <Text style={styles.challengeParticipants}>
                        참가자: {challenge.participants.length}명
                    </Text>
                </View>

                {myParticipant && (
                    <View style={styles.myProgress}>
                        <View style={styles.myProgressHeader}>
                            <Text style={styles.myProgressLabel}>내 진행도</Text>
                            <Text style={styles.myProgressValue}>
                                {myParticipant.current_value.toFixed(1)} / {challenge.target_value} {getGoalUnit(challenge.goal_type)}
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                        </View>
                    </View>
                )}

                <View style={styles.challengeFooter}>
                    <Text style={styles.challengeRank}>
                        내 순위: {myParticipant?.rank || '-'}위
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient colors={['#FF6B6B', '#FFE66D', '#4ECDC4']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>챌린지</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFF" />
                        </View>
                    ) : challenges.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="trophy-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
                            <Text style={styles.emptyText}>진행 중인 챌린지가 없습니다</Text>
                            <Text style={styles.emptySubtext}>친구와 함께 챌린지를 시작해보세요!</Text>
                        </View>
                    ) : (
                        challenges.map(renderChallengeCard)
                    )}
                </ScrollView>

                {/* Create Challenge Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>새 챌린지 만들기</Text>

                                <Text style={styles.label}>챌린지 이름</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="예: 이번 주 10km 달리기"
                                    placeholderTextColor="#999"
                                    value={challengeName}
                                    onChangeText={setChallengeName}
                                />

                                <Text style={styles.label}>목표 유형</Text>
                                <View style={styles.optionGroup}>
                                    <TouchableOpacity
                                        style={[styles.option, goalType === 'distance' && styles.optionActive]}
                                        onPress={() => setGoalType('distance')}
                                    >
                                        <Text style={[styles.optionText, goalType === 'distance' && styles.optionTextActive]}>
                                            거리
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.option, goalType === 'time' && styles.optionActive]}
                                        onPress={() => setGoalType('time')}
                                    >
                                        <Text style={[styles.optionText, goalType === 'time' && styles.optionTextActive]}>
                                            시간
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>목표 값</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={`목표 ${getGoalUnit(goalType)}`}
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    value={targetValue}
                                    onChangeText={setTargetValue}
                                />

                                <Text style={styles.label}>기간 (일)</Text>
                                <View style={styles.optionGroup}>
                                    {['7', '14', '30'].map((d) => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[styles.option, duration === d && styles.optionActive]}
                                            onPress={() => setDuration(d)}
                                        >
                                            <Text style={[styles.optionText, duration === d && styles.optionTextActive]}>
                                                {d}일
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.label}>참가 친구 선택</Text>
                                {friends.length === 0 ? (
                                    <Text style={styles.noFriendsText}>친구가 없습니다</Text>
                                ) : (
                                    <View style={styles.friendsList}>
                                        {friends.map((friend) => (
                                            <TouchableOpacity
                                                key={friend.id}
                                                style={[
                                                    styles.friendItem,
                                                    selectedFriends.includes(friend.id) && styles.friendItemSelected,
                                                ]}
                                                onPress={() => toggleFriendSelection(friend.id)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.friendName,
                                                        selectedFriends.includes(friend.id) && styles.friendNameSelected,
                                                    ]}
                                                >
                                                    {friend.username}
                                                </Text>
                                                {selectedFriends.includes(friend.id) && (
                                                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            resetForm();
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.createButton]}
                                        onPress={createChallenge}
                                    >
                                        <Text style={styles.createButtonText}>생성</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
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
        paddingHorizontal: 20,
    },
    challengeCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    challengeCardInactive: {
        opacity: 0.7,
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    challengeTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    challengeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
    },
    challengeTypeBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    challengeTypeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF',
    },
    daysRemainingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    completedBadge: {
        backgroundColor: '#999',
    },
    daysRemainingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
    challengeGoal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    challengeGoalText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    challengeParticipants: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    myProgress: {
        marginBottom: 12,
    },
    myProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    myProgressLabel: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    myProgressValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFF',
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    challengeRank: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 25,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    optionGroup: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    option: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    optionActive: {
        backgroundColor: '#FF6B6B',
    },
    optionText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    optionTextActive: {
        color: '#FFF',
    },
    friendsList: {
        maxHeight: 200,
        marginBottom: 10,
    },
    friendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 8,
    },
    friendItemSelected: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    friendName: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    friendNameSelected: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    noFriendsText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    createButton: {
        backgroundColor: '#FF6B6B',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

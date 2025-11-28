import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function GoalsScreen({ navigation }) {
    const [goals, setGoals] = useState([]);
    const [completedGoals, setCompletedGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
    
    // 새 목표 입력
    const [goalType, setGoalType] = useState('distance'); // distance, count, time
    const [period, setPeriod] = useState('weekly'); // daily, weekly, monthly
    const [targetValue, setTargetValue] = useState('');

    useEffect(() => {
        loadGoals();
    }, [activeTab]);

    const loadGoals = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('토큰이 없습니다. 로그인이 필요합니다.');
                setLoading(false);
                return;
            }

            const endpoint = activeTab === 'active' ? '/api/goals/' : '/api/goals/completed/';
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 401) {
                console.log('토큰이 만료되었습니다. 로그인이 필요합니다.');
                setLoading(false);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (activeTab === 'active') {
                    setGoals(data);
                } else {
                    setCompletedGoals(data);
                }
            }
        } catch (error) {
            console.error('목표 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const createGoal = async () => {
        if (!targetValue || parseFloat(targetValue) <= 0) {
            Alert.alert('오류', '목표 값을 입력해주세요.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/goals/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goal_type: goalType,
                    target_value: parseFloat(targetValue),
                    period: period,
                }),
            });

            if (response.ok) {
                Alert.alert('성공', '목표가 생성되었습니다.');
                setModalVisible(false);
                setTargetValue('');
                loadGoals();
            } else {
                const error = await response.json();
                Alert.alert('오류', error.detail || '목표 생성 실패');
            }
        } catch (error) {
            console.error('목표 생성 실패:', error);
            Alert.alert('오류', '목표 생성 중 문제가 발생했습니다.');
        }
    };

    const deleteGoal = async (goalId) => {
        Alert.alert(
            '목표 삭제',
            '정말 이 목표를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const response = await fetch(`${API_URL}/api/goals/${goalId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });

                            if (response.ok) {
                                Alert.alert('성공', '목표가 삭제되었습니다.');
                                loadGoals();
                            }
                        } catch (error) {
                            console.error('목표 삭제 실패:', error);
                            Alert.alert('오류', '목표 삭제 중 문제가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const getGoalTypeText = (type) => {
        const types = {
            'distance': '거리',
            'count': '횟수',
            'time': '시간',
        };
        return types[type] || type;
    };

    const getPeriodText = (period) => {
        const periods = {
            'daily': '일간',
            'weekly': '주간',
            'monthly': '월간',
        };
        return periods[period] || period;
    };

    const getGoalUnit = (type) => {
        const units = {
            'distance': 'km',
            'count': '회',
            'time': '분',
        };
        return units[type] || '';
    };

    const renderGoalItem = (goal) => {
        const progress = (goal.current_value / goal.target_value) * 100;
        const isCompleted = goal.is_completed;

        return (
            <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                    <View style={styles.goalTitleContainer}>
                        <Text style={styles.goalType}>{getGoalTypeText(goal.goal_type)}</Text>
                        <Text style={styles.goalPeriod}>{getPeriodText(goal.period)}</Text>
                    </View>
                    {!isCompleted && (
                        <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
                            <Ionicons name="trash-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={styles.goalProgress}>
                    <Text style={styles.goalValue}>
                        {goal.current_value.toFixed(1)} / {goal.target_value} {getGoalUnit(goal.goal_type)}
                    </Text>
                    <Text style={styles.goalPercentage}>{Math.min(progress, 100).toFixed(0)}%</Text>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>

                {isCompleted && (
                    <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.completedText}>완료!</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <LinearGradient colors={['#FF6B6B', '#FFE66D', '#4ECDC4']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>목표</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'active' && styles.tabActive]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                            진행 중 ({goals.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
                        onPress={() => setActiveTab('completed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
                            완료 ({completedGoals.length})
                        </Text>
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
                    ) : activeTab === 'active' ? (
                        goals.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="flag-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
                                <Text style={styles.emptyText}>설정된 목표가 없습니다</Text>
                                <Text style={styles.emptySubtext}>새로운 목표를 만들어보세요!</Text>
                            </View>
                        ) : (
                            goals.map(renderGoalItem)
                        )
                    ) : (
                        completedGoals.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="trophy-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
                                <Text style={styles.emptyText}>완료된 목표가 없습니다</Text>
                            </View>
                        ) : (
                            completedGoals.map(renderGoalItem)
                        )
                    )}
                </ScrollView>

                {/* Create Goal Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>새 목표 만들기</Text>

                            <Text style={styles.label}>목표 유형</Text>
                            <View style={styles.optionGroup}>
                                {['distance', 'count', 'time'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.option, goalType === type && styles.optionActive]}
                                        onPress={() => setGoalType(type)}
                                    >
                                        <Text style={[styles.optionText, goalType === type && styles.optionTextActive]}>
                                            {getGoalTypeText(type)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>기간</Text>
                            <View style={styles.optionGroup}>
                                {['daily', 'weekly', 'monthly'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.option, period === p && styles.optionActive]}
                                        onPress={() => setPeriod(p)}
                                    >
                                        <Text style={[styles.optionText, period === p && styles.optionTextActive]}>
                                            {getPeriodText(p)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
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

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>취소</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.createButton]}
                                    onPress={createGoal}
                                >
                                    <Text style={styles.createButtonText}>생성</Text>
                                </TouchableOpacity>
                            </View>
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
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    tabTextActive: {
        color: '#FFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    goalCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    goalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    goalType: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    goalPeriod: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    goalProgress: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    goalValue: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
    goalPercentage: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: 'bold',
    },
    progressBar: {
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 5,
    },
    completedText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
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
        width: '85%',
        maxWidth: 400,
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
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
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

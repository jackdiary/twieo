import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function HistoryScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [runHistory, setRunHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const periods = [
        { id: 'week', label: '주간' },
        { id: 'month', label: '월간' },
        { id: 'year', label: '연간' },
    ];

    useEffect(() => {
        loadRunHistory();
    }, []);

    const loadRunHistory = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/runs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRunHistory(data);
            }
        } catch (error) {
            console.error('기록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRunHistory();
        setRefreshing(false);
    };

    // 통계 계산
    const calculateStats = () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const weeklyRuns = runHistory.filter(run => {
            const runDate = new Date(run.date);
            return runDate >= weekAgo;
        });

        const totalDistance = weeklyRuns.reduce((sum, run) => sum + run.distance, 0);
        const totalTime = weeklyRuns.reduce((sum, run) => sum + run.duration, 0);
        const avgPace = weeklyRuns.length > 0 
            ? weeklyRuns.reduce((sum, run) => sum + run.pace, 0) / weeklyRuns.length 
            : 0;

        return {
            totalDistance: totalDistance.toFixed(1),
            totalRuns: weeklyRuns.length,
            totalTime: Math.round(totalTime / 60), // 분으로 변환
            avgPace: avgPace.toFixed(1),
        };
    };

    const weeklyStats = calculateStats();

    // 달력 마킹용 날짜 생성
    const getMarkedDates = () => {
        const marked = {};
        runHistory.forEach(run => {
            const dateStr = new Date(run.date).toISOString().split('T')[0];
            marked[dateStr] = { marked: true, dotColor: '#FF6B6B' };
        });
        if (selectedDate) {
            marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#FF6B6B' };
        }
        return marked;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>러닝 기록</Text>
                <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)}>
                    <Ionicons name="calendar-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Calendar */}
            {showCalendar && (
                <View style={styles.calendarContainer}>
                    <Calendar
                        onDayPress={(day) => {
                            setSelectedDate(day.dateString);
                            setShowCalendar(false);
                        }}
                        markedDates={getMarkedDates()}
                        theme={{
                            todayTextColor: '#FF6B6B',
                            selectedDayBackgroundColor: '#FF6B6B',
                            selectedDayTextColor: '#FFF',
                            arrowColor: '#FF6B6B',
                        }}
                    />
                </View>
            )}

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {periods.map((period) => (
                    <TouchableOpacity
                        key={period.id}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period.id && styles.periodButtonActive,
                        ]}
                        onPress={() => setSelectedPeriod(period.id)}
                    >
                        <Text
                            style={[
                                styles.periodButtonText,
                                selectedPeriod === period.id && styles.periodButtonTextActive,
                            ]}
                        >
                            {period.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Weekly Summary */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>이번 주 요약</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Ionicons name="navigate" size={24} color="#FF6B6B" />
                        <Text style={styles.summaryValue}>{weeklyStats.totalDistance}km</Text>
                        <Text style={styles.summaryLabel}>총 거리</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Ionicons name="footsteps" size={24} color="#4CAF50" />
                        <Text style={styles.summaryValue}>{weeklyStats.totalRuns}</Text>
                        <Text style={styles.summaryLabel}>러닝 횟수</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Ionicons name="time" size={24} color="#FFA726" />
                        <Text style={styles.summaryValue}>{Math.floor(weeklyStats.totalTime / 60)}h {weeklyStats.totalTime % 60}m</Text>
                        <Text style={styles.summaryLabel}>총 시간</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Ionicons name="speedometer" size={24} color="#42A5F5" />
                        <Text style={styles.summaryValue}>{weeklyStats.avgPace}</Text>
                        <Text style={styles.summaryLabel}>평균 페이스</Text>
                    </View>
                </View>
            </View>

            {/* Run History List */}
            <ScrollView 
                style={styles.historyList} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text style={styles.listTitle}>최근 활동</Text>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF6B6B" />
                    </View>
                ) : runHistory.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="footsteps-outline" size={60} color="#CCC" />
                        <Text style={styles.emptyText}>아직 러닝 기록이 없습니다</Text>
                        <Text style={styles.emptySubtext}>첫 러닝을 시작해보세요!</Text>
                    </View>
                ) : (
                    runHistory.map((run) => {
                        const runDate = new Date(run.date);
                        const dateStr = runDate.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                        
                        return (
                            <TouchableOpacity key={run.id} style={styles.historyItem}>
                                <View style={styles.historyIcon}>
                                    <Ionicons name="footsteps" size={24} color="#FF6B6B" />
                                </View>
                                <View style={styles.historyDetails}>
                                    <Text style={styles.historyDate}>{dateStr}</Text>
                                    <View style={styles.historyStats}>
                                        <Text style={styles.historyDistance}>{run.distance.toFixed(1)}km</Text>
                                        <Text style={styles.historySeparator}>•</Text>
                                        <Text style={styles.historyTime}>{Math.round(run.duration / 60)}분</Text>
                                        <Text style={styles.historySeparator}>•</Text>
                                        <Text style={styles.historyPace}>{run.pace.toFixed(1)} min/km</Text>
                                    </View>
                                </View>
                                <View style={styles.historyCalories}>
                                    <Text style={styles.caloriesValue}>{run.calories}</Text>
                                    <Text style={styles.caloriesLabel}>kcal</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    calendarContainer: {
        backgroundColor: '#FFF',
        marginBottom: 10,
        padding: 10,
    },
    periodSelector: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 15,
        marginHorizontal: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    periodButtonActive: {
        backgroundColor: '#FF6B6B',
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    periodButtonTextActive: {
        color: '#FFF',
    },
    summaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 20,
        marginBottom: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    historyList: {
        flex: 1,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        padding: 20,
        paddingBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 15,
        marginBottom: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginHorizontal: 10,
    },
    historyIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    historyDetails: {
        flex: 1,
    },
    historyDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    historyStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyDistance: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    historySeparator: {
        marginHorizontal: 8,
        color: '#CCC',
    },
    historyTime: {
        fontSize: 14,
        color: '#666',
    },
    historyPace: {
        fontSize: 14,
        color: '#666',
    },
    historyCalories: {
        alignItems: 'flex-end',
    },
    caloriesValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    caloriesLabel: {
        fontSize: 12,
        color: '#666',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        margin: 20,
        borderRadius: 15,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
});

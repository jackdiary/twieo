import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function AchievementsScreen({ navigation }) {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unlocked', 'locked'

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/achievements/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setAchievements(data);
            }
        } catch (error) {
            console.error('업적 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAchievementIcon = (category) => {
        const icons = {
            'distance': 'medal',
            'count': 'star',
            'speed': 'flash',
            'streak': 'flame',
            'special': 'trophy',
        };
        return icons[category] || 'ribbon';
    };

    const getAchievementColor = (category) => {
        const colors = {
            'distance': '#FFD700',
            'count': '#C0C0C0',
            'speed': '#42A5F5',
            'streak': '#FF6B6B',
            'special': '#9C27B0',
        };
        return colors[category] || '#4CAF50';
    };

    const getCategoryName = (category) => {
        const names = {
            'distance': '거리',
            'count': '횟수',
            'speed': '속도',
            'streak': '연속',
            'special': '특별',
        };
        return names[category] || category;
    };

    const filteredAchievements = achievements.filter(ach => {
        if (filter === 'unlocked') return ach.unlocked;
        if (filter === 'locked') return !ach.unlocked;
        return true;
    });

    const unlockedCount = achievements.filter(ach => ach.unlocked).length;
    const totalCount = achievements.length;

    return (
        <LinearGradient colors={['#FF6B6B', '#FFE66D', '#4ECDC4']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>업적</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{unlockedCount}</Text>
                        <Text style={styles.statLabel}>달성</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalCount}</Text>
                        <Text style={styles.statLabel}>전체</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%</Text>
                        <Text style={styles.statLabel}>달성률</Text>
                    </View>
                </View>

                {/* Filter */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                            전체
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, filter === 'unlocked' && styles.filterButtonActive]}
                        onPress={() => setFilter('unlocked')}
                    >
                        <Text style={[styles.filterText, filter === 'unlocked' && styles.filterTextActive]}>
                            달성
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, filter === 'locked' && styles.filterButtonActive]}
                        onPress={() => setFilter('locked')}
                    >
                        <Text style={[styles.filterText, filter === 'locked' && styles.filterTextActive]}>
                            미달성
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFF" />
                        </View>
                    ) : filteredAchievements.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="trophy-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
                            <Text style={styles.emptyText}>아직 달성한 업적이 없습니다</Text>
                        </View>
                    ) : (
                        filteredAchievements.map((achievement) => (
                            <View
                                key={achievement.id}
                                style={[
                                    styles.achievementCard,
                                    !achievement.unlocked && styles.achievementCardLocked,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.achievementIcon,
                                        {
                                            backgroundColor: achievement.unlocked
                                                ? getAchievementColor(achievement.category)
                                                : 'rgba(255, 255, 255, 0.3)',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={getAchievementIcon(achievement.category)}
                                        size={32}
                                        color="#FFF"
                                    />
                                </View>
                                <View style={styles.achievementInfo}>
                                    <View style={styles.achievementHeader}>
                                        <Text
                                            style={[
                                                styles.achievementName,
                                                !achievement.unlocked && styles.achievementNameLocked,
                                            ]}
                                        >
                                            {achievement.name}
                                        </Text>
                                        <View
                                            style={[
                                                styles.categoryBadge,
                                                {
                                                    backgroundColor: achievement.unlocked
                                                        ? getAchievementColor(achievement.category)
                                                        : 'rgba(255, 255, 255, 0.3)',
                                                },
                                            ]}
                                        >
                                            <Text style={styles.categoryText}>
                                                {getCategoryName(achievement.category)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text
                                        style={[
                                            styles.achievementDescription,
                                            !achievement.unlocked && styles.achievementDescriptionLocked,
                                        ]}
                                    >
                                        {achievement.description}
                                    </Text>
                                    {achievement.unlocked && achievement.unlocked_at && (
                                        <Text style={styles.unlockedDate}>
                                            달성: {new Date(achievement.unlocked_at).toLocaleDateString('ko-KR')}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
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
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: 4,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    filterButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    filterTextActive: {
        color: '#FFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    contentContainer: {
        paddingBottom: 30,
    },
    achievementCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    achievementCardLocked: {
        opacity: 0.6,
    },
    achievementIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    achievementInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    achievementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        gap: 8,
    },
    achievementName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
    },
    achievementNameLocked: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF',
    },
    achievementDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 5,
    },
    achievementDescriptionLocked: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    unlockedDate: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontStyle: 'italic',
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
});

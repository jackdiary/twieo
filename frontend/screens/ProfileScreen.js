import { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../App';
import { API_URL } from '../config/api';

export default function ProfileScreen({ navigation }) {
    const { handleLogout: contextLogout } = useContext(AuthContext);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState({
        name: '러너',
        level: 1,
        totalDistance: 0,
        totalRuns: 0,
        longestRun: 0,
        bestPace: 0,
    });
    const [bio, setBio] = useState('달리는 것을 사랑하는 러너 🏃‍♂️');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioInput, setBioInput] = useState('');
    const [achievements, setAchievements] = useState([]);
    const [goals, setGoals] = useState([]);

    const menuItems = [
        { id: 1, title: '설정', icon: 'settings-outline', screen: 'Settings' },
        { id: 2, title: '알림', icon: 'notifications-outline', screen: 'Notifications' },
        { id: 3, title: '친구', icon: 'people-outline', screen: 'Friends' },
        { id: 4, title: '도움말', icon: 'help-circle-outline', screen: 'Help' },
    ];

    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [])
    );

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            loadProfile(),
            loadAchievements(),
            loadGoals(),
        ]);
        setLoading(false);
    };

    const loadProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                // 토큰이 없으면 기본값 사용
                console.log('토큰이 없습니다. 로그인이 필요합니다.');
                return;
            }

            const response = await fetch(`${API_URL}/api/profile/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                // 토큰이 만료되었거나 유효하지 않음 - 조용히 처리
                console.log('토큰이 만료되었습니다. 로그인이 필요합니다.');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                console.log('Profile Data:', JSON.stringify(data, null, 2));
                // 닉네임이 없으면 AsyncStorage에서 확인하거나 기본값 사용
                let username = data.username;
                if (!username) {
                    username = await AsyncStorage.getItem('username');
                }

                setUserStats({
                    name: username || '러너',
                    level: data.level,
                    totalDistance: data.total_distance || 0,
                    totalRuns: data.total_runs || 0,
                    longestRun: data.longest_run || 0,
                    bestPace: data.best_pace || 0,
                });
                if (data.avatar_url) {
                    setAvatarUrl(`${API_URL}${data.avatar_url}`);
                }
                // bio 로드
                if (data.bio) {
                    setBio(data.bio);
                }
            }
        } catch (error) {
            console.error('프로필 로드 실패:', error);
        }
    };

    const handleBioEdit = () => {
        setBioInput(bio);
        setIsEditingBio(true);
    };

    const handleBioSave = async () => {
        if (bioInput.length > 30) {
            Alert.alert('오류', '한마디는 최대 30자까지 입력 가능합니다.');
            return;
        }
        await saveBio(bioInput);
        setIsEditingBio(false);
    };

    const handleBioCancel = () => {
        setIsEditingBio(false);
        setBioInput('');
    };

    const saveBio = async (newBio) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/profile/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bio: newBio }),
            });

            if (response.ok) {
                setBio(newBio);
                Alert.alert('성공', '한마디가 저장되었습니다.');
            } else {
                Alert.alert('오류', '저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('한마디 저장 실패:', error);
            Alert.alert('오류', '저장 중 문제가 발생했습니다.');
        }
    };

    const loadAchievements = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/achievements/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // 상위 6개만 표시
                const topAchievements = data.slice(0, 6).map(ach => ({
                    id: ach.id,
                    title: ach.name,
                    icon: getAchievementIcon(ach.category),
                    color: getAchievementColor(ach.category),
                    unlocked: ach.unlocked,
                }));
                setAchievements(topAchievements);
            }
        } catch (error) {
            console.error('업적 로드 실패:', error);
        }
    };

    const loadGoals = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/goals/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const formattedGoals = data.map(goal => ({
                    id: goal.id,
                    title: `${getPeriodName(goal.period)} 목표`,
                    current: goal.current_value || 0,
                    target: goal.target_value,
                    unit: getGoalUnit(goal.goal_type),
                }));
                setGoals(formattedGoals);
            }
        } catch (error) {
            console.error('목표 로드 실패:', error);
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
            'distance': '#FFD700', // Gold
            'runs': '#FFC107', // Amber
            'count': '#FFD54F', // Light Amber
            'speed': '#FDD835', // Yellow 600
            'streak': '#FFB300', // Amber 600
            'special': '#FFCA28', // Amber 400
        };
        return colors[category] || '#FFC107'; // Default to Amber
    };

    const getPeriodName = (period) => {
        const names = {
            'daily': '일간',
            'weekly': '주간',
            'monthly': '월간',
        };
        return names[period] || period;
    };

    const getGoalUnit = (goalType) => {
        const units = {
            'distance': 'km',
            'count': '회',
            'time': '분',
        };
        return units[goalType] || '';
    };

    const pickImage = async () => {
        // 권한 요청
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
            return;
        }

        // 이미지 선택
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri) => {
        try {
            setUploading(true);
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return;
            }

            // FormData 생성
            const formData = new FormData();

            // 웹 환경에서는 Blob으로 변환
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();

                // Blob 타입에서 확장자 추출
                let extension = 'jpg';
                if (blob.type) {
                    const typeMatch = blob.type.match(/image\/(\w+)/);
                    if (typeMatch) {
                        extension = typeMatch[1];
                        // jpeg를 jpg로 변환
                        if (extension === 'jpeg') extension = 'jpg';
                    }
                }

                // 파일명 생성 (확장자 포함)
                const filename = `avatar_${Date.now()}.${extension}`;

                // 파일 이름과 타입을 명시적으로 설정
                const file = new File([blob], filename, { type: blob.type || `image/${extension}` });
                formData.append('file', file);

                console.log('업로드 시작 (웹):', filename, blob.type, `크기: ${blob.size} bytes`);
            } else {
                // 모바일 환경
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('file', {
                    uri,
                    name: filename,
                    type,
                });

                console.log('업로드 시작 (모바일):', filename, type);
            }

            const response = await fetch(`${API_URL}/api/profile/avatar/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type은 FormData가 자동으로 설정하므로 제거
                },
                body: formData,
            });

            console.log('응답 상태:', response.status);

            if (response.ok) {
                const data = await response.json();
                setAvatarUrl(`${API_URL}${data.avatar_url}`);
                Alert.alert('성공', '프로필 사진이 업데이트되었습니다.');
            } else {
                const errorText = await response.text();
                console.error('업로드 에러:', errorText);
                try {
                    const error = JSON.parse(errorText);
                    Alert.alert('오류', error.detail || '업로드에 실패했습니다.');
                } catch {
                    Alert.alert('오류', `업로드에 실패했습니다. (${response.status})`);
                }
            }
        } catch (error) {
            console.error('업로드 실패:', error);
            Alert.alert('오류', '업로드 중 문제가 발생했습니다: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '로그아웃',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('userEmail');
                            // Context를 통해 App.js의 로그인 상태 업데이트
                            if (contextLogout) {
                                contextLogout();
                            }
                        } catch (error) {
                            console.error('로그아웃 실패:', error);
                            Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>프로필 로딩 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Bio Edit Modal */}
            <Modal
                visible={isEditingBio}
                transparent={true}
                animationType="fade"
                onRequestClose={handleBioCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>한마디</Text>
                        <Text style={styles.modalSubtitle}>나를 표현하는 한마디를 입력하세요 (최대 30자)</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={bioInput}
                            onChangeText={setBioInput}
                            placeholder="한마디를 입력해보세요"
                            maxLength={30}
                            multiline
                            autoFocus
                        />
                        <Text style={styles.charCount}>{bioInput.length}/30</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleBioCancel}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleBioSave}
                            >
                                <Text style={styles.saveButtonText}>저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={pickImage}
                        disabled={uploading}
                    >
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={40} color="#FFF" />
                            </View>
                        )}
                        <View style={styles.cameraButton}>
                            {uploading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="camera" size={16} color="#FFF" />
                            )}
                        </View>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>Lv.{userStats.level}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.usernameContainer}>
                        <Text style={styles.usernameLabel}>닉네임</Text>
                        <Text style={styles.userName}>{userStats.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleBioEdit} style={styles.bioContainer}>
                        <Text style={styles.userBio}>{bio || '한마디를 입력해보세요'}</Text>
                        <Ionicons name="pencil" size={14} color="#999" style={styles.editIcon} />
                    </TouchableOpacity>
                    <Text style={styles.bioHint}>탭하여 한마디 수정</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{userStats.totalDistance.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>총 거리 (km)</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{userStats.totalRuns}</Text>
                        <Text style={styles.statLabel}>총 러닝</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{userStats.longestRun.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>최장 거리 (km)</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{userStats.bestPace > 0 ? userStats.bestPace.toFixed(1) : '-'}</Text>
                        <Text style={styles.statLabel}>최고 페이스</Text>
                    </View>
                </View>

                {/* Goals */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>목표</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                            <Text style={styles.seeAllText}>전체 보기</Text>
                        </TouchableOpacity>
                    </View>
                    {goals.length === 0 ? (
                        <Text style={styles.emptyText}>설정된 목표가 없습니다</Text>
                    ) : (
                        goals.map((goal) => (
                            <View key={goal.id} style={styles.goalItem}>
                                <View style={styles.goalHeader}>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalProgress}>
                                        {goal.current.toFixed(1)} / {goal.target} {goal.unit}
                                    </Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${Math.min((goal.current / goal.target) * 100, 100)}%` },
                                        ]}
                                    />
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Achievements */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>업적</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
                            <Text style={styles.seeAllText}>전체 보기</Text>
                        </TouchableOpacity>
                    </View>
                    {achievements.length === 0 ? (
                        <Text style={styles.emptyText}>아직 달성한 업적이 없습니다</Text>
                    ) : (
                        <View style={styles.achievementsGrid}>
                            {achievements.map((achievement) => (
                                <View
                                    key={achievement.id}
                                    style={[
                                        styles.achievementCard,
                                        !achievement.unlocked && styles.achievementLocked,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.achievementIcon,
                                            { backgroundColor: achievement.unlocked ? achievement.color : '#E0E0E0' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={achievement.icon}
                                            size={28}
                                            color="#FFF"
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            styles.achievementTitle,
                                            !achievement.unlocked && styles.achievementTitleLocked,
                                        ]}
                                    >
                                        {achievement.title}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Menu */}
                <View style={styles.section}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => item.screen && navigation.navigate(item.screen)}
                        >
                            <Ionicons name={item.icon} size={24} color="#666" />
                            <Text style={styles.menuItemText}>{item.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    profileHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        padding: 30,
        marginBottom: 10,
        borderRadius: 15,
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1,
        marginHorizontal: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 30,
        right: -5,
        backgroundColor: '#4ECDC4',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    levelBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    usernameContainer: {
        alignItems: 'center',
        marginBottom: 5,
    },
    usernameLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    bioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    userBio: {
        fontSize: 14,
        color: '#666',
        marginRight: 5,
    },
    editIcon: {
        marginLeft: 5,
    },
    bioHint: {
        fontSize: 11,
        color: '#999',
        marginTop: 5,
        fontStyle: 'italic',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
        marginHorizontal: 10,
    },
    statCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 20,
        marginBottom: 15,
        borderRadius: 15,
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 20,
        marginBottom: 10,
        borderRadius: 15,
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1,
        marginHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    goalItem: {
        marginBottom: 20,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    goalTitle: {
        fontSize: 16,
        color: '#333',
    },
    goalProgress: {
        fontSize: 14,
        color: '#666',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF6B6B',
        borderRadius: 4,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    achievementCard: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
    },
    achievementLocked: {
        opacity: 0.5,
    },
    achievementIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    achievementTitle: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    achievementTitleLocked: {
        color: '#999',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
    logoutButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 20,
        margin: 20,
        borderRadius: 15,
        alignItems: 'center',
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1,
        marginHorizontal: 10,
    },
    logoutText: {
        fontSize: 16,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    seeAllText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 8,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    saveButton: {
        backgroundColor: '#FF6B6B',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

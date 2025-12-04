import { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert, Modal, Linking, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../App';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');

// 플랫폼별 그림자 스타일 헬퍼
const getShadow = (elevation = 2) => Platform.select({
    ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation },
        shadowOpacity: 0.15,
        shadowRadius: elevation * 2,
    },
    android: {
        // 안드로이드에서는 그림자 없이 배경색만으로 구분
    },
});

export default function HomeScreen({ navigation }) {
    const { handleLogout } = useContext(AuthContext);
    const [username, setUsername] = useState('러너');

    // 플랫폼 확인
    useEffect(() => {
        console.log('='.repeat(50));
        console.log('HomeScreen Platform:', Platform.OS);
        console.log('Platform Version:', Platform.Version);
        console.log('='.repeat(50));
    }, []);
    const [stats, setStats] = useState({
        totalRuns: 0,
        totalDistance: 0,
        totalTime: 0,
        avgPace: 0,
    });
    const [weather, setWeather] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [facilities, setFacilities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [recommendedCourses, setRecommendedCourses] = useState([]);
    const [refreshingWeather, setRefreshingWeather] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            // 홈 화면에 포커스될 때마다 데이터 새로고침
            const token = await AsyncStorage.getItem('token');
            if (token) {
                loadProfile();
                loadAchievements();
            }
        });

        return unsubscribe;
    }, [navigation]);

    const loadData = async () => {
        // 토큰 확인 - 없으면 인증 관련 API 호출 안 함
        const token = await AsyncStorage.getItem('token');

        if (token) {
            await Promise.all([
                loadProfile(),
                loadLocation(),
                loadAchievements(),
            ]);
        } else {
            // 토큰이 없으면 위치와 날씨만 로드
            await loadLocation();
        }
        setLoading(false);
    };

    const refreshWeather = async () => {
        if (!location) {
            Alert.alert('위치 정보 없음', '위치 정보를 먼저 가져와주세요.');
            return;
        }

        setRefreshingWeather(true);
        await loadWeather(location.coords.latitude, location.coords.longitude);
        setRefreshingWeather(false);
    };

    const openMapDirections = (facility) => {
        if (!location) {
            Alert.alert('위치 정보 없음', '현재 위치를 가져올 수 없습니다.');
            return;
        }

        const origin = `${location.coords.latitude},${location.coords.longitude}`;
        const destination = `${facility.latitude},${facility.longitude}`;

        const scheme = Platform.select({
            ios: 'maps:0,0?q=',
            android: 'geo:0,0?q='
        });

        const latLng = `${facility.latitude},${facility.longitude}`;
        const label = facility.name;

        // 구글 맵 URL (웹/앱 모두 지원)
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;

        // 카카오맵 URL
        const kakaoMapUrl = `kakaomap://route?sp=${location.coords.latitude},${location.coords.longitude}&ep=${facility.latitude},${facility.longitude}&by=FOOT`;

        Alert.alert(
            '지도 앱 선택',
            '어떤 지도 앱으로 길찾기를 하시겠습니까?',
            [
                {
                    text: '구글 맵',
                    onPress: () => Linking.openURL(googleMapsUrl).catch(() =>
                        Alert.alert('오류', '구글 맵을 열 수 없습니다.')
                    )
                },
                {
                    text: '카카오맵',
                    onPress: () => Linking.openURL(kakaoMapUrl).catch(() =>
                        Alert.alert('오류', '카카오맵을 열 수 없습니다. 앱이 설치되어 있는지 확인해주세요.')
                    )
                },
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        );
    };

    const loadProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                // 토큰이 없으면 기본값 사용
                const savedUsername = await AsyncStorage.getItem('username');
                if (savedUsername) {
                    setUsername(savedUsername);
                }
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
                setStats({
                    totalRuns: data.total_runs || 0,
                    totalDistance: data.total_distance || 0,
                    totalTime: 0, // 백엔드에 추가 필요
                    avgPace: data.best_pace || 0,
                });

                // 사용자 이름 가져오기 (AsyncStorage에 저장된 username 사용)
                const savedUsername = await AsyncStorage.getItem('username');
                if (savedUsername) {
                    setUsername(savedUsername);
                }
            }
        } catch (error) {
            console.error('프로필 로드 실패:', error);
        }
    };

    const loadLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            await loadWeather(loc.coords.latitude, loc.coords.longitude);
        } catch (error) {
            console.error('위치 로드 실패:', error);
        }
    };

    const loadWeather = async (lat, lon) => {
        try {
            const response = await fetch(`${API_URL}/api/weather/?lat=${lat}&lon=${lon}`);
            if (response.ok) {
                const data = await response.json();
                setWeather(data);

                // 날씨가 나쁘면 실내 시설 로드
                if (!data.is_good_for_running) {
                    await loadFacilities(lat, lon);
                }
            }
        } catch (error) {
            console.error('날씨 로드 실패:', error);
        }
    };

    const loadFacilities = async (lat, lon) => {
        try {
            const response = await fetch(`${API_URL}/api/facilities/indoor/?lat=${lat}&lon=${lon}&weather_condition=bad`);
            if (response.ok) {
                const data = await response.json();
                setFacilities(data.facilities || []);
            }
        } catch (error) {
            console.error('시설 로드 실패:', error);
        }
    };

    const loadAchievements = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/achievements/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 401) {
                // 토큰이 만료되었거나 유효하지 않음 - 조용히 처리
                console.log('토큰이 만료되었습니다. 로그인이 필요합니다.');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                // 상위 3개의 업적만 표시 (잠금 해제된 것 우선)
                const sortedAchievements = data.sort((a, b) => {
                    if (a.unlocked === b.unlocked) return 0;
                    return a.unlocked ? -1 : 1;
                });
                setAchievements(sortedAchievements.slice(0, 3));
            }
        } catch (error) {
            console.error('업적 로드 실패:', error);
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

    const handleFacilityRecommendation = async () => {
        if (!location) {
            Alert.alert('위치 정보 없음', '위치 정보를 가져올 수 없습니다.');
            return;
        }

        if (!weather) {
            Alert.alert('날씨 정보 없음', '날씨 정보를 먼저 불러와주세요.');
            return;
        }

        // 날씨가 좋으면 실외 러닝 권장하지만 선택 가능
        if (weather.is_good_for_running) {
            Alert.alert(
                '실외 러닝 추천',
                '현재 날씨가 좋습니다!\n실외에서 러닝하기 좋은 날씨입니다. 🏃‍♂️\n\n그래도 실내 시설을 확인하시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '시설 보기',
                        onPress: async () => {
                            try {
                                const response = await fetch(
                                    `${API_URL}/api/facilities/indoor?lat=${location.coords.latitude}&lon=${location.coords.longitude}&weather_condition=good`
                                );

                                if (response.ok) {
                                    const data = await response.json();
                                    if (data.facilities && data.facilities.length > 0) {
                                        setRecommendedCourses(data.facilities.slice(0, 5));
                                        setShowCourseModal(true);
                                    } else {
                                        Alert.alert('시설 없음', '근처에 추천할 공공체육시설이 없습니다.');
                                    }
                                }
                            } catch (error) {
                                console.error('시설 추천 실패:', error);
                                Alert.alert('오류', '시설 정보를 가져올 수 없습니다.');
                            }
                        }
                    }
                ]
            );
            return;
        }

        // 날씨가 나쁘면 바로 근처 공공체육시설 추천
        try {
            const response = await fetch(
                `${API_URL}/api/facilities/indoor?lat=${location.coords.latitude}&lon=${location.coords.longitude}&weather_condition=bad`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.facilities && data.facilities.length > 0) {
                    setRecommendedCourses(data.facilities.slice(0, 5)); // 상위 5개만
                    setShowCourseModal(true);
                } else {
                    Alert.alert('시설 없음', '근처에 추천할 공공체육시설이 없습니다.');
                }
            }
        } catch (error) {
            console.error('시설 추천 실패:', error);
            Alert.alert('오류', '시설 정보를 가져올 수 없습니다.');
        }
    };

    const quickActions = [
        { id: 1, title: '빠른 러닝', subtitle: '지금 바로 시작', icon: 'play-circle', color: '#FF6B6B', action: () => navigation.navigate('Run') },
        { id: 2, title: '공공체육관', subtitle: '근처 시설 찾기', icon: 'business', color: '#4CAF50', action: handleFacilityRecommendation },
        { id: 3, title: '목표 설정', subtitle: '새로운 도전', icon: 'trophy', color: '#FFA726', action: () => navigation.navigate('Goals') },
        { id: 4, title: '친구와 뛰기', subtitle: '챌린지 시작', icon: 'people', color: '#42A5F5', action: () => navigation.navigate('Challenges') },
    ];



    return (
        <ImageBackground
            source={require('../aa.jpg')}
            style={styles.background}
            resizeMode="cover"
            imageStyle={{ opacity: Platform.OS === 'android' ? 1 : 1 }}
            onLoad={() => console.log('✅ 배경 이미지 로드 성공')}
            onError={(error) => console.error('❌ 배경 이미지 로드 실패:', error)}
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={Platform.OS === 'android'}
            />
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Facility Recommendation Modal */}
                <Modal
                    visible={showCourseModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCourseModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>근처 공공체육시설</Text>
                                <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                                    <Ionicons name="close" size={28} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.modalBody}>
                                {recommendedCourses.map((facility, index) => (
                                    <View
                                        key={index}
                                        style={styles.courseItem}
                                    >
                                        <View style={styles.courseIcon}>
                                            <Ionicons name="fitness" size={32} color="#4CAF50" />
                                        </View>
                                        <View style={styles.courseInfo}>
                                            <Text style={styles.courseName}>{facility.name || `시설 ${index + 1}`}</Text>
                                            <Text style={styles.courseDistance}>{facility.distance ? `${facility.distance.toFixed(1)}km` : '거리 정보 없음'}</Text>
                                            <Text style={styles.courseDescription}>{facility.address || '주소 정보 없음'}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.mapButton}
                                            onPress={() => openMapDirections(facility)}
                                        >
                                            <Ionicons name="map" size={24} color="#4CAF50" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>안녕하세요!</Text>
                        <Text style={styles.username}>{username}님</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Stats Card */}
                    {/* Stats Card */}
                    <View style={[styles.card, styles.statsCard]}>
                        <Text style={styles.sectionTitle}>이번 달 통계</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Ionicons name="footsteps" size={24} color="#FF6B6B" />
                                <Text style={styles.statValue}>{stats.totalRuns}</Text>
                                <Text style={styles.statLabel}>러닝</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="navigate" size={24} color="#4CAF50" />
                                <Text style={styles.statValue}>{stats.totalDistance.toFixed(2)}km</Text>
                                <Text style={styles.statLabel}>거리</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="time" size={24} color="#FFA726" />
                                <Text style={styles.statValue}>{Math.floor(stats.totalTime / 60)}h</Text>
                                <Text style={styles.statLabel}>시간</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="speedometer" size={24} color="#42A5F5" />
                                <Text style={styles.statValue}>{stats.avgPace.toFixed(2)}</Text>
                                <Text style={styles.statLabel}>평균 페이스</Text>
                            </View>
                        </View>
                    </View>

                    {/* Weather Card */}
                    {/* Weather Card */}
                    {weather && (
                        <View style={[styles.card, styles.weatherCard]}>
                            <View style={styles.weatherHeader}>
                                <Text style={styles.sectionTitle}>오늘의 날씨</Text>
                                <TouchableOpacity
                                    onPress={refreshWeather}
                                    disabled={refreshingWeather}
                                    style={styles.refreshButton}
                                >
                                    <Ionicons
                                        name="refresh"
                                        size={24}
                                        color={refreshingWeather ? '#999' : '#FFF'}
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.weatherContent}>
                                <Ionicons
                                    name={weather.is_good_for_running ? 'sunny' : 'rainy'}
                                    size={48}
                                    color={weather.is_good_for_running ? '#FFD700' : '#666'}
                                />
                                <View style={styles.weatherInfo}>
                                    <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
                                    <Text style={styles.weatherCondition}>{weather.condition}</Text>
                                    <Text style={styles.weatherRecommendation}>{weather.recommendation}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Indoor Facilities (if bad weather) */}
                    {facilities.length > 0 && (
                        <View style={styles.facilitiesCard}>
                            <Text style={styles.sectionTitle}>추천 실내 시설</Text>
                            {facilities.slice(0, 3).map((facility, index) => (
                                <View key={index} style={styles.facilityItem}>
                                    <Ionicons name="business" size={24} color="#4CAF50" />
                                    <View style={styles.facilityInfo}>
                                        <Text style={styles.facilityName}>{facility.name}</Text>
                                        <Text style={styles.facilityDistance}>{facility.distance.toFixed(1)}km</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.quickActionsContainer}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.card, styles.quickActionsCard]}
                                onPress={action.action}
                            >
                                <View style={styles.quickActionBlur}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                                        <Ionicons name={action.icon} size={28} color="#FFF" />
                                    </View>
                                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                                    <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Achievements */}
                    {achievements.length > 0 && (
                        <TouchableOpacity
                            style={styles.achievementsCard}
                            onPress={() => navigation.navigate('Achievements')}
                        >
                            <View style={styles.achievementsHeader}>
                                <Text style={styles.sectionTitle}>업적</Text>
                                <Ionicons name="chevron-forward" size={20} color="#FFF" />
                            </View>
                            <View style={styles.achievementsList}>
                                {achievements.map((achievement) => (
                                    <View
                                        key={achievement.id}
                                        style={[
                                            styles.achievementItem,
                                            !achievement.unlocked && styles.achievementLocked,
                                        ]}
                                    >
                                        <Ionicons
                                            name={getAchievementIcon(achievement.category)}
                                            size={32}
                                            color={achievement.unlocked ? getAchievementColor(achievement.category) : '#E0E0E0'}
                                        />
                                        <Text
                                            style={[
                                                styles.achievementTitle,
                                                !achievement.unlocked && styles.achievementTitleLocked,
                                            ]}
                                        >
                                            {achievement.name}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Start Running Button */}
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => navigation.navigate('Run')}
                    >
                        <Ionicons name="play-circle" size={32} color="#FFF" />
                        <Text style={styles.startButtonText}>러닝 시작하기</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a', // 이미지 로드 전 기본 배경색
    },
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: 'rgba(26, 26, 26, 0.7)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        zIndex: 100,
    },
    greeting: {
        fontSize: 16,
        color: '#FFF',
        opacity: 0.8,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 4,
    },
    settingsButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,

    },
    card: {
        backgroundColor: 'rgba(26, 26, 26, 0.5)',
        padding: 20,
        borderRadius: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    statsCard: {
        // card 스타일 상속
    },
    sectionTitle: {

        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 15,
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.7,
        marginTop: 4,
        marginTop: 4,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    quickActionsCard: {
        width: '48%',
        // card 스타일 상속 (padding, borderRadius, marginBottom, border 등)
    },
    quickActionBlur: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    quickActionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickActionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffffff',
        marginBottom: 4,
        marginBottom: 4,
    },
    quickActionSubtitle: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.7,
        opacity: 0.7,
    },
    achievementsCard: {
        backgroundColor: 'rgba(26, 26, 26, 0.5)',
        padding: 20,
        borderRadius: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    achievementsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    achievementsList: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    achievementItem: {
        alignItems: 'center',
    },
    achievementLocked: {
        opacity: 0.5,
    },
    achievementTitle: {
        fontSize: 12,
        color: '#FFF',
        marginTop: 8,
        marginTop: 8,
    },
    achievementTitleLocked: {
        opacity: 0.5,
    },
    weatherCard: {
        // card 스타일 상속
    },
    weatherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refreshButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    weatherContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    weatherInfo: {
        marginLeft: 20,
        flex: 1,
    },
    weatherTemp: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    weatherCondition: {
        fontSize: 16,
        color: '#FFF',
        opacity: 0.9,
        marginTop: 4,
    },
    weatherRecommendation: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.7,
        marginTop: 8,
    },
    facilitiesCard: {
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
    },
    facilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    facilityInfo: {
        marginLeft: 15,
        flex: 1,
    },
    facilityName: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
    facilityDistance: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.7,
        marginTop: 4,
    },
    startButton: {
        backgroundColor: '#FF6B6B',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 15,
        marginBottom: 40,
        overflow: 'hidden',
        ...(Platform.OS === 'ios' ? getShadow(4) : {}),
    },
    startButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
    },
    courseIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    courseInfo: {
        flex: 1,
    },
    courseName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    courseDistance: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
        marginBottom: 4,
    },
    courseDescription: {
        fontSize: 14,
        color: '#666',
    },
    mapButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
    },
});

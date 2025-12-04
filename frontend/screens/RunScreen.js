import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

// Conditionally import MapView only on native platforms
let MapView, Polyline, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Polyline = Maps.Polyline;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width, height } = Dimensions.get('window');

// 두 좌표 간 거리 계산 (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function RunScreen() {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedDistance, setSelectedDistance] = useState(3.0);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [runStats, setRunStats] = useState({
        distance: 0,
        time: 0,
        pace: 0,
        calories: 0,
    });
    const [routePath, setRoutePath] = useState([]);

    const lastLocationRef = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const lastAnnouncedKmRef = useRef(0);
    const nextWaypointIndexRef = useRef(0);

    const distances = [1.0, 3.0, 5.0, 10.0];

    // 음성 안내 함수
    const speak = (text) => {
        Speech.speak(text, { language: 'ko-KR', rate: 1.0 });
    };

    // 방향 계산 함수 (두 점 사이의 방위각)
    const calculateBearing = (startLat, startLon, destLat, destLon) => {
        const startLatRad = startLat * Math.PI / 180;
        const startLonRad = startLon * Math.PI / 180;
        const destLatRad = destLat * Math.PI / 180;
        const destLonRad = destLon * Math.PI / 180;

        const y = Math.sin(destLonRad - startLonRad) * Math.cos(destLatRad);
        const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLonRad - startLonRad);
        const brng = Math.atan2(y, x) * 180 / Math.PI;
        return (brng + 360) % 360;
    };

    const checkVoiceGuidance = (distance, pace, currentCoords) => {
        // 1. 거리 안내 (1km 단위)
        const currentKm = Math.floor(distance);
        if (currentKm > lastAnnouncedKmRef.current) {
            const paceMin = Math.floor(pace);
            const paceSec = Math.round((pace - paceMin) * 60);
            speak(`${currentKm}킬로미터 돌파. 현재 페이스 ${paceMin}분 ${paceSec}초입니다.`);
            lastAnnouncedKmRef.current = currentKm;
        }

        // 2. 방향 안내 (생성된 코스가 있을 때만)
        if (routes.length > 0 && selectedRouteIndex < routes.length) {
            const route = routes[selectedRouteIndex].route || []; // route 구조에 따라 조정 필요
            // route가 [{lat, lon}, ...] 형태라고 가정 (generate_course 응답 구조 확인 필요)
            // 실제로는 selectedRoute 변수를 사용하는 것이 더 안전함 (이미 변환됨)

            const targetRoute = selectedRoute; // 렌더링용으로 변환된 좌표 사용

            if (targetRoute && targetRoute.length > nextWaypointIndexRef.current + 1) {
                const nextPoint = targetRoute[nextWaypointIndexRef.current + 1];
                const distToNext = calculateDistance(
                    currentCoords.latitude, currentCoords.longitude,
                    nextPoint.latitude, nextPoint.longitude
                );

                // 다음 포인트에 30m 이내로 접근하면
                if (distToNext < 0.03) {
                    // 그 다음 포인트가 있다면 방향 계산
                    if (targetRoute.length > nextWaypointIndexRef.current + 2) {
                        const nextNextPoint = targetRoute[nextWaypointIndexRef.current + 2];

                        const bearing1 = calculateBearing(
                            currentCoords.latitude, currentCoords.longitude,
                            nextPoint.latitude, nextPoint.longitude
                        );
                        const bearing2 = calculateBearing(
                            nextPoint.latitude, nextPoint.longitude,
                            nextNextPoint.latitude, nextNextPoint.longitude
                        );

                        let turnAngle = (bearing2 - bearing1 + 360) % 360;
                        if (turnAngle > 180) turnAngle -= 360;

                        if (turnAngle > 45) {
                            speak("잠시 후 우회전입니다.");
                        } else if (turnAngle < -45) {
                            speak("잠시 후 좌회전입니다.");
                        }
                    }

                    // 웨이포인트 인덱스 증가 (지나친 것으로 간주)
                    nextWaypointIndexRef.current += 1;
                }
            }
        }
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('위치 권한이 필요해요! 😭');
                return;
            }

            // 1. 캐시된 마지막 위치 먼저 가져오기 (속도 개선)
            let lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) setLocation(lastKnown);

            // 2. 정확한 현재 위치 가져오기
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
        })();
    }, []);

    // GPS tracking effect
    useEffect(() => {
        let subscription;
        if (isRunning && !isPaused) {
            (async () => {
                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 1000,
                        distanceInterval: 5,
                    },
                    (newLocation) => {
                        setLocation(newLocation);

                        // 경로에 추가
                        const newCoord = {
                            latitude: newLocation.coords.latitude,
                            longitude: newLocation.coords.longitude,
                        };
                        setRoutePath(prev => [...prev, newCoord]);

                        // 거리 계산
                        if (lastLocationRef.current) {
                            const dist = calculateDistance(
                                lastLocationRef.current.latitude,
                                lastLocationRef.current.longitude,
                                newLocation.coords.latitude,
                                newLocation.coords.longitude
                            );

                            setRunStats(prev => {
                                const newDistance = prev.distance + dist;
                                const newTime = prev.time;
                                const newPace = newDistance > 0 ? (newTime / 60) / newDistance : 0;
                                const newCalories = newDistance * 65; // 대략적인 칼로리 계산

                                // 음성 안내 체크
                                checkVoiceGuidance(newDistance, newPace, newLocation.coords);

                                return {
                                    distance: newDistance,
                                    time: newTime,
                                    pace: newPace,
                                    calories: newCalories,
                                };
                            });
                        }

                        lastLocationRef.current = newCoord;
                    }
                );
            })();
        }

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [isRunning, isPaused]);

    // Timer effect
    useEffect(() => {
        if (isRunning && !isPaused) {
            timerRef.current = setInterval(() => {
                setRunStats(prev => {
                    const newTime = prev.time + 1;
                    const newPace = prev.distance > 0 ? (newTime / 60) / prev.distance : 0;
                    return {
                        ...prev,
                        time: newTime,
                        pace: newPace,
                    };
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRunning, isPaused]);

    const generateCourse = async () => {
        if (!location) return;
        setLoading(true);
        try {
            console.log('코스 생성 요청:', `${API_URL}/generate_course`);
            const response = await fetch(`${API_URL}/generate_course`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lat: location.coords.latitude,
                    lon: location.coords.longitude,
                    distance: selectedDistance,
                    preference: 'scenic',
                }),
            });

            const data = await response.json();
            console.log('서버 응답 데이터:', JSON.stringify(data, null, 2));

            if (data.status === 'success') {
                if (data.routes && data.routes.length > 0) {
                    console.log('생성된 코스 개수:', data.routes.length);
                    console.log('첫 번째 코스:', data.routes[0]);
                    setRoutes(data.routes);
                    setSelectedRouteIndex(0);
                    Alert.alert('성공! 🎉', `${data.routes.length}개의 ${selectedDistance}km 코스가 생성되었습니다.`);
                } else {
                    Alert.alert('실패 😢', '경로를 찾을 수 없습니다.');
                }
            } else if (data.status === 'bad_weather') {
                Alert.alert('앗! 비가 오네요 ☔️', '실내 운동 시설을 추천해 드릴게요!');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('연결 실패 🚨', '서버와 연결할 수 없어요.');
        } finally {
            setLoading(false);
        }
    };

    const startRunning = () => {
        setIsRunning(true);
        setIsPaused(false);
        setRunStats({ distance: 0, time: 0, pace: 0, calories: 0 });
        setRoutePath([]);
        lastLocationRef.current = location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        } : null;
        startTimeRef.current = Date.now();
        lastAnnouncedKmRef.current = 0;
        nextWaypointIndexRef.current = 0;
        speak("러닝을 시작합니다. 안전하게 달리세요!");
    };

    const pauseRunning = () => {
        setIsPaused(true);
    };

    const resumeRunning = () => {
        setIsPaused(false);
    };

    const stopRunning = async () => {
        Alert.alert(
            '러닝 종료',
            '러닝을 종료하고 기록을 저장하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '저장',
                    onPress: async () => {
                        await saveRun();
                        setIsRunning(false);
                        setIsPaused(false);
                        setRunStats({ distance: 0, time: 0, pace: 0, calories: 0 });
                        setRoutePath([]);
                        lastLocationRef.current = null;
                    },
                },
            ]
        );
    };

    const saveRun = async () => {
        const runData = {
            distance: runStats.distance,
            duration: runStats.time,
            pace: runStats.pace,
            calories: Math.round(runStats.calories),
            route: routePath,
            date: new Date().toISOString(), // 날짜 추가
        };

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                // 비로그인 상태에서도 로컬 저장 시도
                throw new Error('No token');
            }

            const response = await fetch(`${API_URL}/api/runs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(runData),
            });

            if (response.ok) {
                Alert.alert('성공! 🎉', '러닝 기록이 저장되었습니다.');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.error('전송 실패, 로컬 저장 시도:', error);
            try {
                // 로컬 저장 로직
                const existingRuns = await AsyncStorage.getItem('unsaved_runs');
                const runs = existingRuns ? JSON.parse(existingRuns) : [];
                runs.push(runData);
                await AsyncStorage.setItem('unsaved_runs', JSON.stringify(runs));

                Alert.alert(
                    '전송 실패 ⚠️',
                    '서버와 연결할 수 없어 기기에 임시 저장했습니다.\n나중에 다시 시도해주세요.'
                );
            } catch (localError) {
                console.error('로컬 저장 실패:', localError);
                Alert.alert('오류 🚨', '기록을 저장할 수 없습니다.');
            }
        }
    };

    // waypoints를 MapView가 사용할 수 있는 형식으로 변환
    const selectedRoute = routes[selectedRouteIndex]?.waypoints?.map(wp => ({
        latitude: wp.lat,
        longitude: wp.lon
    })) || routes[selectedRouteIndex]?.route || [];

    // 디버깅: 선택된 경로 확인
    if (routes.length > 0) {
        console.log('전체 코스 개수:', routes.length);
        console.log('선택된 인덱스:', selectedRouteIndex);
        console.log('선택된 코스 데이터:', routes[selectedRouteIndex]);
        console.log('선택된 경로 좌표 개수:', selectedRoute.length);
        if (selectedRoute.length > 0) {
            console.log('첫 번째 좌표:', selectedRoute[0]);
        }
    }

    return (
        <View style={styles.container}>
            {/* Map Area */}
            {location ? (
                Platform.OS === 'web' ? (
                    // Web fallback - simple placeholder
                    <View style={[styles.map, styles.webMapPlaceholder]}>
                        <Ionicons name="map" size={80} color="#FF6B6B" />
                        <Text style={styles.webMapText}>지도는 모바일 앱에서 사용 가능합니다</Text>
                        <Text style={styles.webMapSubtext}>
                            위치: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                        </Text>
                    </View>
                ) : (
                    <RunMap
                        location={location}
                        isRunning={isRunning}
                        selectedRoute={selectedRoute}
                        routePath={routePath}
                    />
                )
            ) : (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>{errorMsg || '위치를 찾고 있어요... 🛰️'}</Text>
                </View>
            )}

            {/* Running Stats Overlay */}
            {isRunning && (
                <SafeAreaView style={styles.statsOverlay} edges={['top']}>
                    <View style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>거리</Text>
                                <Text style={styles.statValue}>{runStats.distance.toFixed(2)} km</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>시간</Text>
                                <Text style={styles.statValue}>
                                    {Math.floor(runStats.time / 60)}:{(runStats.time % 60).toString().padStart(2, '0')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>페이스</Text>
                                <Text style={styles.statValue}>{runStats.pace.toFixed(1)} min/km</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>칼로리</Text>
                                <Text style={styles.statValue}>{Math.round(runStats.calories)} kcal</Text>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            )}

            {/* Controls */}
            {!isRunning && (
                <View style={styles.controlsContainer}>
                    {/* Route Options */}
                    {routes.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeSelector}>
                            {routes.map((routeOption, index) => (
                                <TouchableOpacity
                                    key={`route-${index}`}
                                    style={[
                                        styles.routeOption,
                                        selectedRouteIndex === index && styles.routeOptionSelected
                                    ]}
                                    onPress={() => setSelectedRouteIndex(index)}
                                >
                                    <Text style={[
                                        styles.routeOptionText,
                                        selectedRouteIndex === index && styles.routeOptionTextSelected
                                    ]}>코스 {index + 1}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Distance Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.distanceSelector}>
                        {distances.map((dist) => (
                            <TouchableOpacity
                                key={dist}
                                style={[
                                    styles.distancePill,
                                    selectedDistance === dist && styles.distancePillSelected
                                ]}
                                onPress={() => setSelectedDistance(dist)}
                            >
                                <Text style={[
                                    styles.distanceText,
                                    selectedDistance === dist && styles.distanceTextSelected
                                ]}>{dist}km</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actionCard}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={generateCourse}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="map" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>코스 생성</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Start/Pause/Stop Buttons */}
            <SafeAreaView style={styles.runButtonContainer} edges={['bottom']}>
                {!isRunning ? (
                    <TouchableOpacity
                        style={styles.runButton}
                        onPress={startRunning}
                        activeOpacity={0.8}
                    >
                        <View style={styles.runButtonInner}>
                            <Ionicons name="play" size={48} color="#FFF" style={styles.playIcon} />
                            <Text style={styles.runButtonText}>시작</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.runningControls}>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.pauseButton]}
                            onPress={isPaused ? resumeRunning : pauseRunning}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isPaused ? 'play' : 'pause'}
                                size={32}
                                color="#FFF"
                            />
                            <Text style={styles.controlButtonText}>
                                {isPaused ? '재개' : '일시정지'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.stopButton]}
                            onPress={stopRunning}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="stop" size={32} color="#FFF" />
                            <Text style={styles.controlButtonText}>종료</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    map: {
        width: width,
        height: height,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#FF8A80',
        fontSize: 16,
    },
    statsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    statsCard: {
        padding: 20,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.7,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 120,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20,
    },
    routeSelector: {
        marginBottom: 10,
        paddingHorizontal: 20,
        maxHeight: 60,
    },
    routeOption: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 15,
        marginRight: 10,
    },
    routeOptionSelected: {
        backgroundColor: '#FF6B6B',
    },
    routeOptionText: {
        color: '#000000ff',
        fontWeight: 'bold',
    },
    routeOptionTextSelected: {
        color: '#FFF',
    },
    distanceSelector: {
        backgroundColor: '#d82020ff',
        marginBottom: 1,
        paddingHorizontal: 2,
        borderRadius: 15,
        margin: 10,
    },
    distancePill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 15,
        marginRight: 10,
    },
    distancePillSelected: {
        backgroundColor: '#d82020ff',
    },
    distanceText: {

        color: '#000000ff',
        fontWeight: 'bold',
    },
    distanceTextSelected: {
        color: '#FFF',
    },
    actionCard: {
        width: '90%',
        padding: 15,
        borderRadius: 15,
    },
    button: {
        backgroundColor: '#493edfff',
        paddingVertical: 16,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    runButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    runButton: {
        width: '100%',
        maxWidth: 300,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    runButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIcon: {
        marginRight: 8,
    },
    runButtonText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    runningControls: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
        maxWidth: 300,
        justifyContent: 'space-between',
    },
    controlButton: {
        flex: 1,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    controlButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    pauseButton: {
        backgroundColor: '#FFC107',
    },
    stopButton: {
        backgroundColor: '#FF6B6B',
    },
    webMapPlaceholder: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webMapText: {
        fontSize: 18,
        color: '#333',
        marginTop: 20,
        fontWeight: 'bold',
    },
    webMapSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
    },
});

// Memoized Map Component to prevent re-renders on timer ticks
const RunMap = memo(({ location, isRunning, selectedRoute, routePath }) => {
    return (
        <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            }}
            showsUserLocation={true}
            followsUserLocation={isRunning}
        >
            {/* 생성된 코스 표시 */}
            {selectedRoute.length > 0 && (
                <>
                    <Polyline
                        coordinates={selectedRoute}
                        strokeColor="#004288"
                        strokeWidth={5}
                        lineDashPattern={[10, 5]}
                    />
                    <Marker coordinate={selectedRoute[0]} title="출발점 🚩" />
                    {selectedRoute.length > 1 && (
                        <Marker coordinate={selectedRoute[selectedRoute.length - 1]} title="도착점 🏁" pinColor="blue" />
                    )}
                </>
            )}

            {/* 실제 러닝 경로 표시 */}
            {routePath.length > 0 && isRunning && (
                <>
                    <Polyline
                        coordinates={routePath}
                        strokeColor="#4CAF50"
                        strokeWidth={6}
                    />
                    {routePath.length > 0 && (
                        <Marker coordinate={routePath[0]} title="출발! 🚩" />
                    )}
                </>
            )}
        </MapView>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for performance
    // Only re-render if these props change
    return (
        prevProps.location === nextProps.location &&
        prevProps.isRunning === nextProps.isRunning &&
        prevProps.selectedRoute === nextProps.selectedRoute &&
        prevProps.routePath === nextProps.routePath
    );
});

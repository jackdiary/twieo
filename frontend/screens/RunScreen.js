import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';
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

    const distances = [1.0, 3.0, 5.0, 10.0];

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('위치 권한이 필요해요! 😭');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
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
            const response = await fetch('http://192.168.219.42:8000/generate_course', {
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

            if (data.status === 'success') {
                if (data.routes && data.routes.length > 0) {
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
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return;
            }

            const response = await fetch(`${API_URL}/api/runs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    distance: runStats.distance,
                    duration: runStats.time,
                    pace: runStats.pace,
                    calories: Math.round(runStats.calories),
                    route: routePath,
                }),
            });

            if (response.ok) {
                Alert.alert('성공! 🎉', '러닝 기록이 저장되었습니다.');
            } else {
                Alert.alert('오류', '기록 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('저장 실패:', error);
            Alert.alert('오류', '기록 저장 중 문제가 발생했습니다.');
        }
    };

    const selectedRoute = routes[selectedRouteIndex]?.route || [];

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
                        {selectedRoute.length > 0 && !isRunning && (
                            <>
                                <Polyline
                                    coordinates={selectedRoute}
                                    strokeColor="#FF6B6B"
                                    strokeWidth={6}
                                />
                                <Marker coordinate={selectedRoute[0]} title="출발! 🚩" />
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
                                    key={routeOption.id}
                                    style={[
                                        styles.routeOption,
                                        selectedRouteIndex === index && styles.routeOptionSelected
                                    ]}
                                    onPress={() => setSelectedRouteIndex(index)}
                                >
                                    <Text style={[
                                        styles.routeOptionText,
                                        selectedRouteIndex === index && styles.routeOptionTextSelected
                                    ]}>코스 {routeOption.id}</Text>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
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
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 15,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    routeOptionSelected: {
        backgroundColor: '#FF6B6B',
    },
    routeOptionText: {
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
    routeOptionTextSelected: {
        color: '#FFF',
    },
    distanceSelector: {
        marginBottom: 15,
        paddingHorizontal: 20,
        maxHeight: 50,
    },
    distancePill: {
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 15,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    distancePillSelected: {
        backgroundColor: '#FF6B6B',
    },
    distanceText: {
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
    distanceTextSelected: {
        color: '#FFF',
    },
    actionCard: {
        width: '90%',
        padding: 15,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    button: {
        backgroundColor: '#FF6B6B',
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
        borderWidth: 3,
        borderColor: '#FFF',
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

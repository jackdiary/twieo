import { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../App';

export default function SettingsScreen({ navigation }) {
    const { handleLogout: contextLogout } = useContext(AuthContext);
    const [notifications, setNotifications] = useState(true);
    const [locationTracking, setLocationTracking] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedNotifications = await AsyncStorage.getItem('settings_notifications');
            const savedLocationTracking = await AsyncStorage.getItem('settings_locationTracking');
            const savedDarkMode = await AsyncStorage.getItem('settings_darkMode');

            if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
            if (savedLocationTracking !== null) setLocationTracking(savedLocationTracking === 'true');
            if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
        } catch (error) {
            console.error('설정 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (key, value) => {
        try {
            await AsyncStorage.setItem(`settings_${key}`, value.toString());
        } catch (error) {
            console.error('설정 저장 실패:', error);
        }
    };

    const handleNotificationsChange = (value) => {
        setNotifications(value);
        saveSettings('notifications', value);
        if (value) {
            Alert.alert('알림 활성화', '푸시 알림이 활성화되었습니다.');
        }
    };

    const handleLocationTrackingChange = (value) => {
        setLocationTracking(value);
        saveSettings('locationTracking', value);
        if (!value) {
            Alert.alert(
                '위치 추적 비활성화',
                '위치 추적을 비활성화하면 러닝 기록이 정확하지 않을 수 있습니다.',
                [{ text: '확인' }]
            );
        }
    };

    const handleDarkModeChange = (value) => {
        setDarkMode(value);
        saveSettings('darkMode', value);
        Alert.alert('다크 모드', value ? '다크 모드가 활성화되었습니다.' : '라이트 모드가 활성화되었습니다.');
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };

    const handlePrivacyPolicy = () => {
        setShowPrivacyModal(true);
    };

    const handleTermsOfService = () => {
        setShowTermsModal(true);
    };

    const handleLogout = () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
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
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '계정 삭제',
            '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('준비 중', '계정 삭제 기능은 준비 중입니다.');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Privacy Policy Modal */}
            <Modal
                visible={showPrivacyModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPrivacyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>개인정보 처리방침</Text>
                            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalText}>
                                <Text style={styles.modalBold}>1. 개인정보의 수집 및 이용 목적{'\n\n'}</Text>
                                뛰어(Twieo)는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.{'\n\n'}
                                
                                - 회원 가입 및 관리{'\n'}
                                - 러닝 기록 저장 및 분석{'\n'}
                                - 위치 기반 서비스 제공{'\n'}
                                - 친구 기능 및 챌린지 서비스{'\n\n'}
                                
                                <Text style={styles.modalBold}>2. 수집하는 개인정보 항목{'\n\n'}</Text>
                                - 필수항목: 이메일, 비밀번호, 닉네임{'\n'}
                                - 선택항목: 프로필 사진, 위치 정보{'\n\n'}
                                
                                <Text style={styles.modalBold}>3. 개인정보의 보유 및 이용 기간{'\n\n'}</Text>
                                회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.{'\n\n'}
                                
                                <Text style={styles.modalBold}>4. 개인정보의 제3자 제공{'\n\n'}</Text>
                                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.{'\n\n'}
                                
                                <Text style={styles.modalBold}>5. 개인정보 처리의 위탁{'\n\n'}</Text>
                                회사는 서비스 향상을 위해 개인정보 처리를 외부에 위탁할 수 있으며, 이 경우 사전에 고지합니다.{'\n\n'}
                                
                                <Text style={styles.modalBold}>6. 이용자의 권리{'\n\n'}</Text>
                                이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보 삭제를 요청할 수 있습니다.
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Terms of Service Modal */}
            <Modal
                visible={showTermsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTermsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>이용약관</Text>
                            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalText}>
                                <Text style={styles.modalBold}>제1조 (목적){'\n\n'}</Text>
                                본 약관은 뛰어(Twieo) 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.{'\n\n'}
                                
                                <Text style={styles.modalBold}>제2조 (정의){'\n\n'}</Text>
                                1. "서비스"란 뛰어가 제공하는 러닝 기록, 분석, 친구 기능 등 모든 서비스를 의미합니다.{'\n'}
                                2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원을 말합니다.{'\n\n'}
                                
                                <Text style={styles.modalBold}>제3조 (약관의 효력 및 변경){'\n\n'}</Text>
                                1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.{'\n'}
                                2. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.{'\n\n'}
                                
                                <Text style={styles.modalBold}>제4조 (서비스의 제공){'\n\n'}</Text>
                                1. 회사는 다음과 같은 서비스를 제공합니다:{'\n'}
                                - 러닝 기록 및 분석{'\n'}
                                - 위치 기반 경로 추천{'\n'}
                                - 친구 및 챌린지 기능{'\n'}
                                - 업적 및 목표 관리{'\n\n'}
                                
                                <Text style={styles.modalBold}>제5조 (이용자의 의무){'\n\n'}</Text>
                                1. 이용자는 다음 행위를 하여서는 안 됩니다:{'\n'}
                                - 타인의 정보 도용{'\n'}
                                - 허위 정보 등록{'\n'}
                                - 서비스 운영 방해{'\n'}
                                - 기타 관련 법령 위반 행위{'\n\n'}
                                
                                <Text style={styles.modalBold}>제6조 (서비스 이용의 제한){'\n\n'}</Text>
                                회사는 이용자가 본 약관을 위반한 경우 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.{'\n\n'}
                                
                                <Text style={styles.modalBold}>제7조 (면책조항){'\n\n'}</Text>
                                회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>설정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 30 }}
            >
                {/* 알림 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>알림</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>푸시 알림</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={handleNotificationsChange}
                            trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* 개인정보 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>개인정보</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="location-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>위치 추적</Text>
                        </View>
                        <Switch
                            value={locationTracking}
                            onValueChange={handleLocationTrackingChange}
                            trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* 화면 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>화면</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="moon-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>다크 모드</Text>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={handleDarkModeChange}
                            trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* 계정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>계정</Text>
                    <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="key-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>비밀번호 변경</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="shield-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>개인정보 처리방침</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="document-text-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>이용약관</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                {/* 앱 정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>앱 정보</Text>
                    <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Help')}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="help-circle-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>도움말</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="information-circle-outline" size={24} color="#666" />
                            <Text style={styles.settingText}>버전</Text>
                        </View>
                        <Text style={styles.versionNumber}>1.0.0</Text>
                    </View>
                </View>

                {/* 위험 구역 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>위험 구역</Text>
                    <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                            <Text style={[styles.settingText, { color: '#FF6B6B' }]}>계정 삭제</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>

                {/* 로그아웃 */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
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
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        marginTop: 10,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#999',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
    logoutButton: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        margin: 20,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#FF6B6B',
    },
    logoutText: {
        fontSize: 16,
        color: '#FF6B6B',
        fontWeight: '600',
        marginLeft: 10,
    },
    versionNumber: {
        fontSize: 14,
        color: '#999',
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
        width: '90%',
        maxHeight: '80%',
        overflow: 'hidden',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    modalText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#666',
    },
    modalBold: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 15,
    },
});

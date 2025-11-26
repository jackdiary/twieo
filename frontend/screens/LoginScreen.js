import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ImageBackground, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function LoginScreen({ navigation, onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // 토큰 저장
                await AsyncStorage.setItem('token', data.access_token);
                await AsyncStorage.setItem('userEmail', email);
                
                // 사용자 정보 가져오기
                try {
                    const userResponse = await fetch(`${API_URL}/api/users/me`, {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`,
                        },
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        await AsyncStorage.setItem('username', userData.username);
                    }
                } catch (err) {
                    console.log('Username 저장 실패:', err);
                }
                
                Alert.alert('성공', '로그인되었습니다!');
                
                // 로그인 상태 업데이트
                if (onLogin) {
                    onLogin();
                }
            } else {
                Alert.alert('로그인 실패', data.detail || '이메일 또는 비밀번호가 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            Alert.alert('오류', '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../aa.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.content}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoBox}>
                                <Image 
                                    source={require('../rrrrrr.png')} 
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.logoText}>뛰어</Text>
                            <Text style={styles.logoSubtext}>당신의 러닝 파트너</Text>
                        </View>

                        {/* Login Form */}
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#FFF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="이메일"
                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#FFF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="비밀번호"
                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={styles.loginButtonText}>
                                    {loading ? '로그인 중...' : '로그인'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.registerButton}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={styles.registerButtonText}>
                                    계정이 없으신가요? 회원가입
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoBox: {
        width: 150,
        height: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
    logoSubtext: {
        fontSize: 16,
        color: '#FFF',
        marginTop: 8,
        opacity: 0.9,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 15,
        marginBottom: 15,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#FFF',
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 15,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: 16,
        opacity: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
});

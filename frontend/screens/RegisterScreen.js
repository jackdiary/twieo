import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ImageBackground, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function RegisterScreen({ navigation, onRegister }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !username || !password || !confirmPassword) {
            Alert.alert('오류', '모든 필드를 입력해주세요.');
            return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.\n예: user@example.com');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        setLoading(true);
        try {
            console.log('회원가입 요청:', { email, username });

            const response = await fetch(`${API_URL}/api/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    username: username.trim(),
                    password: password,
                }),
            });

            const data = await response.json();
            console.log('서버 응답:', response.status, data);

            if (response.ok) {
                // 회원가입 후 자동 로그인
                const loginFormData = new FormData();
                loginFormData.append('username', email.trim());
                loginFormData.append('password', password);

                const loginResponse = await fetch(`${API_URL}/api/auth/login/`, {
                    method: 'POST',
                    body: loginFormData,
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    await AsyncStorage.setItem('token', loginData.access_token);
                    await AsyncStorage.setItem('userEmail', email.trim());
                    await AsyncStorage.setItem('username', username.trim());

                    Alert.alert('성공', '회원가입이 완료되었습니다!');

                    if (onRegister) {
                        onRegister();
                    }
                } else {
                    Alert.alert('성공', '회원가입이 완료되었습니다!', [
                        { text: '확인', onPress: () => navigation.navigate('Login') }
                    ]);
                }
            } else {
                // 상세한 에러 메시지 표시
                let errorMessage = '회원가입 중 오류가 발생했습니다.';

                if (response.status === 422) {
                    // 유효성 검사 실패
                    if (data.detail && Array.isArray(data.detail)) {
                        // Pydantic 유효성 검사 에러
                        const errors = data.detail.map(err => {
                            const field = err.loc ? err.loc[err.loc.length - 1] : '필드';
                            return `${field}: ${err.msg}`;
                        }).join('\n');
                        errorMessage = `입력 데이터 오류:\n${errors}`;
                    } else if (data.detail) {
                        errorMessage = data.detail;
                    } else {
                        errorMessage = '입력한 정보를 확인해주세요.\n이메일 형식: user@example.com';
                    }
                } else if (data.detail) {
                    if (data.detail === 'Username already taken') {
                        errorMessage = '이미 사용 중인 닉네임입니다.\n다른 닉네임을 사용해주세요.';
                    } else if (data.detail === 'Email already registered') {
                        errorMessage = '이미 가입된 이메일입니다.\n로그인을 시도해주세요.';
                    } else {
                        errorMessage = data.detail;
                    }
                }

                Alert.alert(
                    '회원가입 실패',
                    errorMessage,
                    [{ text: '확인' }]
                );
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            Alert.alert(
                '오류',
                `서버와 연결할 수 없습니다.\n\n에러: ${error.message}\n\n네트워크를 확인해주세요.`,
                [{ text: '확인' }]
            );
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
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Ionicons name="arrow-back" size={28} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>회원가입</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoBox}>
                                <Image
                                    source={require('../rrrrrr.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        {/* Form */}
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
                                <Ionicons name="person-outline" size={20} color="#FFF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="닉네임 (친구 검색용)"
                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#FFF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="비밀번호 (최소 6자)"
                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#FFF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="비밀번호 확인"
                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <Text style={styles.registerButtonText}>
                                    {loading ? '가입 중...' : '회원가입'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.loginLinkText}>
                                    이미 계정이 있으신가요? 로그인
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoBox: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignItems: 'center',
        borderRadius: 15,
        marginBottom: 15,
        paddingHorizontal: 15,
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
    registerButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 15,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#FFF',
        fontSize: 14,
        opacity: 0.8,
    },
});

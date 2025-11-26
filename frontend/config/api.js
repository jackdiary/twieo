
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 환경별 API URL 설정
const API_CONFIG = {
    // 프로덕션 환경 (실제 배포 시 변경)
    production: {
        apiUrl: 'https://api.twieo.shop',  // 실제 API 도메인으로 변경
    },
    // 개발 환경
    development: {
        fallbackIp: '192.168.219.42',  // 현재 컴퓨터 IP
    }
};

// API 설정 - 환경과 플랫폼에 따라 자동으로 URL 설정
const getApiUrl = () => {
    // 프로덕션 환경 체크 (앱 빌드 시)
    const isProduction = Constants.expoConfig?.extra?.environment === 'production' 
        || __DEV__ === false;
    
    if (isProduction) {
        console.log('🚀 Production mode - Using production API');
        return API_CONFIG.production.apiUrl;
    }
    
    // 개발 환경
    console.log('🔧 Development mode');
    
    // 웹 환경
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    }
    
    // 모바일 환경 - Expo의 호스트 IP 자동 감지
    try {
        const debuggerHost = Constants.expoConfig?.hostUri 
            || Constants.manifest2?.extra?.expoGo?.debuggerHost
            || Constants.manifest?.debuggerHost;
        
        if (debuggerHost) {
            const host = debuggerHost.split(':')[0];
            console.log('📱 Detected host:', host);
            return `http://${host}:8000`;
        }
    } catch (error) {
        console.error('Error detecting host:', error);
    }
    
    // 기본값 - 설정된 IP 주소 사용
    console.warn('⚠️  Using fallback IP address');
    return `http://${API_CONFIG.development.fallbackIp}:8000`;
};

export const API_URL = getApiUrl();

console.log('🌐 API URL:', API_URL);

// API 헬퍼 함수
export const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || '요청 실패');
        }

        return data;
    } catch (error) {
        console.error('API 요청 오류:', error);
        throw error;
    }
};

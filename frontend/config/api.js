
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 환경별 API URL 설정
const API_CONFIG = {
    // 프로덕션 환경 (네이버 클라우드 서버)
    production: {
        apiUrl: 'http://110.165.18.249:8000',  // 네이버 클라우드 서버
    },
    // 개발 환경
    development: {
        fallbackIp: '192.168.219.42',  // 현재 컴퓨터 IP
    }
};

// API 설정 - 모든 환경에서 프로덕션 서버 사용 (임시)
const getApiUrl = () => {
    console.log('🌐 Using production API for all platforms');
    console.log('Platform:', Platform.OS);
    console.log('DEV mode:', __DEV__);
    
    // 모든 환경에서 프로덕션 서버 사용
    return API_CONFIG.production.apiUrl;
};

export const API_URL = getApiUrl();

console.log('='.repeat(50));
console.log('🌐 API Configuration');
console.log('Platform:', Platform.OS);
console.log('__DEV__:', __DEV__);
console.log('API URL:', API_URL);
console.log('='.repeat(50));

// 서버 연결 테스트
fetch(`${API_URL}/docs`)
    .then(response => {
        console.log('✅ 서버 연결 성공:', response.status);
    })
    .catch(error => {
        console.error('❌ 서버 연결 실패:', error.message);
        console.error('서버 URL 확인:', API_URL);
    });

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

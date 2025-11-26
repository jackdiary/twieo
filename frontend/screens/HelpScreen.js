import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen({ navigation }) {
    const [expandedId, setExpandedId] = useState(null);

    const faqItems = [
        {
            id: 1,
            question: '러닝을 시작하려면 어떻게 하나요?',
            answer: '홈 화면에서 "빠른 러닝" 버튼을 누르거나, 러닝 탭에서 시작 버튼을 눌러 러닝을 시작할 수 있습니다. GPS 권한이 필요합니다.',
            icon: 'play-circle',
        },
        {
            id: 2,
            question: '코스는 어떻게 생성하나요?',
            answer: '러닝 화면에서 원하는 거리를 선택하고 "코스 생성" 버튼을 누르면 현재 위치 기반으로 추천 코스가 생성됩니다.',
            icon: 'map',
        },
        {
            id: 3,
            question: '날씨가 나쁠 때는 어떻게 하나요?',
            answer: '날씨가 좋지 않을 때는 자동으로 주변 실내 체육시설을 추천해드립니다. 체육관, 수영장 등 다양한 시설을 확인할 수 있습니다.',
            icon: 'rainy',
        },
        {
            id: 4,
            question: '러닝 기록은 어디서 볼 수 있나요?',
            answer: '기록 탭에서 모든 러닝 기록을 확인할 수 있습니다. 달력 뷰로 날짜별 기록을 보거나, 주간/월간 통계를 확인할 수 있습니다.',
            icon: 'stats-chart',
        },
        {
            id: 5,
            question: '프로필 사진은 어떻게 변경하나요?',
            answer: '프로필 탭에서 프로필 사진을 터치하면 갤러리에서 사진을 선택할 수 있습니다. 선택한 사진은 자동으로 업로드됩니다.',
            icon: 'camera',
        },
        {
            id: 6,
            question: '친구는 어떻게 추가하나요?',
            answer: '프로필 탭의 친구 메뉴에서 친구를 검색하고 추가할 수 있습니다. 친구와 함께 러닝 기록을 공유하고 경쟁할 수 있습니다.',
            icon: 'people',
        },
        {
            id: 7,
            question: 'GPS가 정확하지 않아요',
            answer: 'GPS 정확도를 높이려면: 1) 위치 권한을 "항상 허용"으로 설정 2) 건물 밖에서 러닝 시작 3) 잠시 기다려 GPS 신호 안정화',
            icon: 'location',
        },
        {
            id: 8,
            question: '알림 설정은 어떻게 하나요?',
            answer: '프로필 탭의 알림 메뉴에서 러닝 알림, 목표 달성 알림, 날씨 알림 등을 개별적으로 설정할 수 있습니다.',
            icon: 'notifications',
        },
    ];

    const contactOptions = [
        { id: 1, title: '이메일 문의', subtitle: '9radaaa@gmail.com', icon: 'mail', color: '#FF6B6B' },
        { id: 2, title: '카카오톡 문의', subtitle: '@new6', icon: 'chatbubbles', color: '#FFE66D' },
        { id: 3, title: '공식 웹사이트', subtitle: 'www.twieo.com', icon: 'globe', color: '#4ECDC4' },
    ];

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const showTermsOfService = () => {
        Alert.alert(
            '이용약관',
            '제1조 (목적)\n본 약관은 뛰어(Twieo) 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조 (서비스의 제공)\n회사는 러닝 코스 추천, 기록 관리, 날씨 정보 제공 등의 서비스를 제공합니다.\n\n제3조 (회원가입)\n서비스 이용을 위해서는 회원가입이 필요하며, 정확한 정보를 제공해야 합니다.\n\n제4조 (개인정보 보호)\n회사는 관련 법령에 따라 이용자의 개인정보를 보호합니다.\n\n제5조 (서비스 이용 제한)\n부적절한 사용이나 법령 위반 시 서비스 이용이 제한될 수 있습니다.',
            [{ text: '확인' }],
            { cancelable: true }
        );
    };

    const showPrivacyPolicy = () => {
        Alert.alert(
            '개인정보 처리방침',
            '1. 수집하는 개인정보\n- 필수: 이메일, 닉네임, 비밀번호\n- 선택: 프로필 사진, 러닝 기록\n\n2. 개인정보의 이용 목적\n- 회원 관리 및 서비스 제공\n- 러닝 기록 저장 및 통계 제공\n- 친구 기능 제공\n\n3. 개인정보의 보유 기간\n- 회원 탈퇴 시까지 보유\n- 탈퇴 후 즉시 파기\n\n4. 개인정보의 제3자 제공\n- 원칙적으로 제3자에게 제공하지 않습니다\n\n5. 이용자의 권리\n- 개인정보 열람, 수정, 삭제 요청 가능\n- 서비스 탈퇴 가능',
            [{ text: '확인' }],
            { cancelable: true }
        );
    };

    const showOpenSourceLicenses = () => {
        Alert.alert(
            '오픈소스 라이선스',
            '본 앱은 다음 오픈소스 라이브러리를 사용합니다:\n\n• React Native (MIT License)\n• Expo (MIT License)\n• React Navigation (MIT License)\n• FastAPI (MIT License)\n• SQLAlchemy (MIT License)\n• expo-location (MIT License)\n• expo-notifications (MIT License)\n• @react-native-async-storage (MIT License)\n\n자세한 라이선스 정보는 각 라이브러리의 공식 문서를 참조하세요.',
            [{ text: '확인' }],
            { cancelable: true }
        );
    };

    return (
        <LinearGradient
            colors={['#FF6B6B', '#FFE66D', '#4ECDC4']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>도움말</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* App Info */}
                    <View style={styles.infoCard}>
                        <Image 
                            source={require('../rrrrrr.png')} 
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>뛰어 (Twieo)</Text>
                        <Text style={styles.appVersion}>버전 1.0.0</Text>
                        <Text style={styles.appDescription}>
                            날씨 기반 러닝 코스 추천 및{'\n'}실내 시설 안내 앱
                        </Text>
                    </View>

                    {/* FAQ */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
                        {faqItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.faqItem}
                                onPress={() => toggleExpand(item.id)}
                            >
                                <View style={styles.faqHeader}>
                                    <Ionicons name={item.icon} size={24} color="#FFF" />
                                    <Text style={styles.faqQuestion}>{item.question}</Text>
                                    <Ionicons
                                        name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color="rgba(255, 255, 255, 0.7)"
                                    />
                                </View>
                                {expandedId === item.id && (
                                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Contact */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>문의하기</Text>
                        {contactOptions.map((option) => (
                            <TouchableOpacity key={option.id} style={styles.contactItem}>
                                <View style={[styles.contactIcon, { backgroundColor: option.color }]}>
                                    <Ionicons name={option.icon} size={24} color="#FFF" />
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactTitle}>{option.title}</Text>
                                    <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Legal */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>법적 정보</Text>
                        <TouchableOpacity style={styles.legalItem} onPress={showTermsOfService}>
                            <Text style={styles.legalText}>이용약관</Text>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.legalItem} onPress={showPrivacyPolicy}>
                            <Text style={styles.legalText}>개인정보 처리방침</Text>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.legalItem} onPress={showOpenSourceLicenses}>
                            <Text style={styles.legalText}>오픈소스 라이선스</Text>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© 2024 Twieo. All rights reserved.</Text>
                    </View>
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    contentContainer: {
        paddingBottom: 100,
    },
    infoCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 30,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 15,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 15,
    },
    appVersion: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 5,
    },
    appDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    faqItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    faqQuestion: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 12,
    },
    faqAnswer: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 12,
        marginLeft: 36,
        lineHeight: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    contactSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    legalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    legalText: {
        fontSize: 15,
        color: '#FFF',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
    },
});

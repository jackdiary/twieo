import { Platform, StyleSheet } from 'react-native';

// 플랫폼별 그림자 스타일
export const getShadowStyle = (elevation = 2) => {
    if (Platform.OS === 'android') {
        return {
            elevation: elevation,
        };
    }
    return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation },
        shadowOpacity: 0.15,
        shadowRadius: elevation * 2,
    };
};

// 플랫폼별 카드 스타일
export const getCardStyle = () => ({
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    ...getShadowStyle(2),
});

// 플랫폼별 버튼 스타일
export const getButtonStyle = (color = '#FF6B6B') => ({
    backgroundColor: color,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...getShadowStyle(3),
});

// 플랫폼별 텍스트 스타일
export const getTextStyle = () => ({
    ...Platform.select({
        android: {
            fontFamily: 'Roboto',
        },
        ios: {
            fontFamily: 'System',
        },
        default: {
            fontFamily: 'System',
        },
    }),
});

// 공통 스타일
export const commonStyles = StyleSheet.create({
    card: getCardStyle(),
    button: getButtonStyle(),
    text: getTextStyle(),
});

import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
    return (
        <LinearGradient
            colors={['#FF6B6B', '#FFE66D', '#4ECDC4']}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.logoBox}>
                    <Image 
                        source={require('../rrrrrr.png')} 
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>뛰어</Text>
                <Text style={styles.subtitle}>Twieo</Text>
                <ActivityIndicator size="large" color="#FFF" style={styles.loader} />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 10,
    },
    loader: {
        marginTop: 40,
    },
});

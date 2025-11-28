import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function FriendsScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            if (activeTab === 'friends') {
                await loadFriends(token);
            } else {
                await loadFriendRequests(token);
            }
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFriends = async (token) => {
        try {
            const response = await fetch(`${API_URL}/api/friends/list/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setFriends(data);
            }
        } catch (error) {
            console.error('친구 목록 로드 실패:', error);
        }
    };

    const loadFriendRequests = async (token) => {
        try {
            const response = await fetch(`${API_URL}/api/friends/requests/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setFriendRequests(data);
            }
        } catch (error) {
            console.error('친구 요청 로드 실패:', error);
        }
    };

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/friends/search/?username=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error('검색 실패:', error);
        } finally {
            setSearching(false);
        }
    };

    const sendFriendRequest = async (username) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/friends/request/?friend_username=${encodeURIComponent(username)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.ok) {
                Alert.alert('성공', '친구 요청을 보냈습니다.');
                setSearchQuery('');
                setSearchResults([]);
            } else {
                const error = await response.json();
                Alert.alert('오류', error.detail || '친구 요청 실패');
            }
        } catch (error) {
            console.error('친구 요청 실패:', error);
            Alert.alert('오류', '친구 요청 중 문제가 발생했습니다.');
        }
    };

    const acceptFriendRequest = async (friendshipId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/friends/accept/${friendshipId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.ok) {
                Alert.alert('성공', '친구 요청을 수락했습니다.');
                loadData();
            }
        } catch (error) {
            console.error('친구 수락 실패:', error);
            Alert.alert('오류', '친구 수락 중 문제가 발생했습니다.');
        }
    };

    const rejectFriendRequest = async (friendshipId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/friends/reject/${friendshipId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.ok) {
                Alert.alert('성공', '친구 요청을 거절했습니다.');
                loadData();
            }
        } catch (error) {
            console.error('친구 거절 실패:', error);
            Alert.alert('오류', '친구 거절 중 문제가 발생했습니다.');
        }
    };

    const deleteFriend = async (friendId) => {
        Alert.alert(
            '친구 삭제',
            '정말 이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const response = await fetch(`${API_URL}/api/friends/${friendId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            
                            if (response.ok) {
                                Alert.alert('성공', '친구를 삭제했습니다.');
                                loadData();
                            }
                        } catch (error) {
                            console.error('친구 삭제 실패:', error);
                            Alert.alert('오류', '친구 삭제 중 문제가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const renderFriendItem = (friend) => (
        <View key={friend.id} style={styles.friendItem}>
            <View style={styles.avatarContainer}>
                {friend.avatar_url ? (
                    <Image source={{ uri: `${API_URL}${friend.avatar_url}` }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                )}
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lv.{friend.level}</Text>
                </View>
            </View>
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.username}</Text>
                <Text style={styles.friendStats}>{friend.total_distance?.toFixed(1) || 0}km 달성</Text>
            </View>
            <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteFriend(friend.id)}
            >
                <Ionicons name="trash-outline" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    const renderRequestItem = (request) => {
        // 요청 데이터가 없으면 렌더링하지 않음
        if (!request) {
            console.warn('Invalid friend request data:', request);
            return null;
        }
        
        return (
            <View key={request.id} style={styles.requestItem}>
                <View style={styles.avatarContainer}>
                    {request.avatar_url ? (
                        <Image source={{ uri: `${API_URL}${request.avatar_url}` }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={24} color="#FFF" />
                        </View>
                    )}
                </View>
                <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{request.username || '알 수 없음'}</Text>
                    <Text style={styles.friendStats}>Lv.{request.level || 1} · {request.total_distance?.toFixed(1) || 0}km</Text>
                </View>
            <View style={styles.requestButtons}>
                <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => acceptFriendRequest(request.id)}
                >
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => rejectFriendRequest(request.id)}
                >
                    <Ionicons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
        );
    };

    const renderSearchResult = (user) => (
        <View key={user.id} style={styles.searchResultItem}>
            <View style={styles.avatarContainer}>
                {user.avatar_url ? (
                    <Image source={{ uri: `${API_URL}${user.avatar_url}` }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                )}
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lv.{user.level}</Text>
                </View>
            </View>
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{user.username}</Text>
                <Text style={styles.friendStats}>{user.total_distance?.toFixed(1) || 0}km 달성</Text>
            </View>
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => sendFriendRequest(user.username)}
            >
                <Ionicons name="person-add" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

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
                    <Text style={styles.headerTitle}>친구</Text>
                    <TouchableOpacity>
                        <Ionicons name="person-add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.7)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="닉네임으로 검색..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            searchUsers(text);
                        }}
                    />
                    {searching && <ActivityIndicator size="small" color="#FFF" />}
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                        <Text style={styles.searchResultsTitle}>검색 결과</Text>
                        {searchResults.map(renderSearchResult)}
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
                        onPress={() => setActiveTab('friends')}
                    >
                        <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
                            친구 ({friends.length}/20)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
                        onPress={() => setActiveTab('requests')}
                    >
                        <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                            요청 ({friendRequests.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFF" />
                        </View>
                    ) : activeTab === 'friends' ? (
                        friends.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
                                <Text style={styles.emptyText}>아직 친구가 없습니다</Text>
                                <Text style={styles.emptySubtext}>친구를 추가하고 함께 달려보세요!</Text>
                            </View>
                        ) : (
                            friends.map(renderFriendItem)
                        )
                    ) : (
                        friendRequests.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="mail-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
                                <Text style={styles.emptyText}>새로운 요청이 없습니다</Text>
                            </View>
                        ) : (
                            friendRequests.map(renderRequestItem)
                        )
                    )}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#FFF',
    },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    tabTextActive: {
        color: '#FFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    levelText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    friendStats: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultsContainer: {
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 10,
    },
    searchResultsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    requestButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    acceptButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 8,
    },
});

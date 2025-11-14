import React, { useEffect, useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text,
  Image,
  TouchableOpacity, 
  ScrollView,
  StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';
import { STORAGE_KEYS } from '../constants/storageKeys';


function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ photos: 0, tags: 0, collections: 0 });
  const [collections, setCollections] = useState([]);
  const [allMedia, setAllMedia] = useState([]);

  useEffect(() => {
    loadStats();
    
    // Add listener to reload stats when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadStats();
    });
    
    return unsubscribe;
  }, [navigation]);

 const loadStats = async () => {
  try {
    // Load media data
    const mediaData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
    const collectionsData = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
    
    let photosCount = 0;
    let tagsCount = 0;
    let collectionsCount = 0;
    
    // Count photos and tags
    if (mediaData) {
      const media = JSON.parse(mediaData);
      setAllMedia(media);
      photosCount = media.length;
      
      // Count unique tags
      const uniqueTags = new Set();
      media.forEach(item => {
        item.tags?.forEach(tag => uniqueTags.add(tag));
      });
      tagsCount = uniqueTags.size;
      
      // Group by first tag for collections preview
      const grouped = media.reduce((acc, item) => {
        const tag = item.tags?.[0] || 'Other';
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(item);
        return acc;
      }, {});

      const cols = Object.entries(grouped).map(([name, items]) => ({
        name,
        count: items.length,
        coverImage: items[0]?.uri,
        mediaItem: items[0]
      }));
      setCollections(cols);
    }
    
    // Count collections
    if (collectionsData) {
      const collections = JSON.parse(collectionsData);
      collectionsCount = collections.length;
    }
    
    // Update stats
    setStats({
      photos: photosCount,
      tags: tagsCount,
      collections: collectionsCount
    });
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

  const loadMediaForDetail = (uri) => {
    const mediaItem = allMedia.find(m => m.uri === uri);
    if (mediaItem) {
      navigation.navigate('MediaDetailModal', { media: mediaItem });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FrameFlow</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#3C3C3C" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="image-outline" size={24} color="#6B7280" />
        <Text style={styles.statNumber}>{stats.photos.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Photos</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="pricetag-outline" size={24} color="#6B7280" />
        <Text style={styles.statNumber}>{stats.tags.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Tags</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="folder-outline" size={24} color="#6B7280" />
        <Text style={styles.statNumber}>{stats.collections}</Text>
        <Text style={styles.statLabel}>Collections</Text>
      </View>
</View>

        {/* Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionsScroll}>
            {collections.map((col, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.collectionCard}
                onPress={() => {
                  if (col.coverImage) {
                    // Find the full media item to pass to detail screen
                    loadMediaForDetail(col.coverImage);
                  }
                }}
              >
                {col.coverImage ? (
                  <Image source={{ uri: col.coverImage }} style={styles.collectionImage} />
                ) : (
                  <View style={[styles.collectionImage, styles.collectionImageEmpty]}>
                    <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.collectionOverlay}>
                  <Text style={styles.collectionName}>{col.name}</Text>
                  <Text style={styles.collectionCount}>{col.count} photos</Text>
                </View>
              </TouchableOpacity>
            ))}
            {collections.length === 0 && (
              <View style={styles.emptyCollections}>
                <Text style={styles.emptyText}>No collections yet</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Explore */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore</Text>
          </View>
          <View style={styles.emptyExplore}>
            <Ionicons name="compass-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyExploreText}>Coming soon</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



export default HomeScreen;
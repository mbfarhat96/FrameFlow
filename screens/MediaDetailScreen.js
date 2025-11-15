import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/globalStyles';
import { STORAGE_KEYS } from '../constants/storageKeys';

function MediaDetailScreen({ navigation, route }) {
  const { media, showAddButton = false } = route.params;
  const [showTags, setShowTags] = useState(false);

  const addToGallery = async () => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      const existingMedia = existingData ? JSON.parse(existingData) : [];
      
      // Check if media already exists
      const exists = existingMedia.some(m => m.uri === media.uri);
      if (exists) {
        Alert.alert('Already Added', 'This photo is already in your gallery.');
        return;
      }

      // Add to gallery
      const newMedia = {
        ...media,
        id: Date.now().toString() + Math.random().toString(),
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.MEDIA,
        JSON.stringify([...existingMedia, newMedia])
      );

      Alert.alert('Success', 'Photo added to your gallery!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding to gallery:', error);
      Alert.alert('Error', 'Failed to add photo to gallery.');
    }
  };

  return (
    <View style={styles.mediaDetailContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Full Screen Image */}
      <Image 
        source={{ uri: media.uri }} 
        style={styles.mediaDetailImage}
        resizeMode="cover"
      />

      {/* Dark Overlay */}
      <View style={styles.mediaDetailDarkOverlay} />

      {/* Top Bar */}
      <View style={styles.mediaDetailTopBar}>
        <TouchableOpacity 
          style={styles.mediaDetailBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom Bar */}
      <View style={styles.mediaDetailBottomBar}>
        <TouchableOpacity 
          style={styles.tagsButton}
          onPress={() => setShowTags(!showTags)}
        >
          <Ionicons name="pricetag-outline" size={18} color="white" />
          <Text style={styles.tagsButtonText}>
            Tags ({media.tags?.length || 0})
          </Text>
        </TouchableOpacity>

        {showAddButton && (
          <TouchableOpacity style={styles.addButton} onPress={addToGallery}>
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tags Sheet */}
      {showTags && media.tags && media.tags.length > 0 && (
        <View style={styles.tagsSheet}>
          <View style={styles.tagsSheetHandle} />
          <Text style={styles.tagsSheetTitle}>Tags</Text>
          <View style={styles.tagsSheetContent}>
            {media.tags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tagsSheetInfo}>
            <Text style={styles.tagsSheetCategory}>{media.category}</Text>
            <Text style={styles.tagsSheetDate}>
              {new Date(media.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default MediaDetailScreen;

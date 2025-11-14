import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/globalStyles';
import { STORAGE_KEYS } from '../constants/storageKeys';

function AddFromGalleryScreen({ navigation, route }) {
  const { collectionId } = route.params;
  const [allMedia, setAllMedia] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const mediaData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      if (mediaData) {
        setAllMedia(JSON.parse(mediaData));
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const togglePhotoSelection = (photo) => {
    if (selectedPhotos.some(p => p.id === photo.id)) {
      setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id));
    } else {
      setSelectedPhotos([...selectedPhotos, photo]);
    }
  };

  const addPhotosToCollection = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please select at least one photo.');
      return;
    }

    try {
      const collectionsData = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      const collections = collectionsData ? JSON.parse(collectionsData) : [];
      
      const collectionIndex = collections.findIndex(c => c.id === collectionId);
      if (collectionIndex === -1) return;

      collections[collectionIndex].photos = [
        ...collections[collectionIndex].photos,
        ...selectedPhotos
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
      
      Alert.alert('Success', `${selectedPhotos.length} photo(s) added to collection!`);
      navigation.navigate('CollectionDetail', { 
        collection: collections[collectionIndex] 
      });
    } catch (error) {
      console.error('Error adding photos:', error);
      Alert.alert('Error', 'Failed to add photos to collection.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Photos</Text>
        <TouchableOpacity onPress={addPhotosToCollection}>
          <Text style={styles.headerDoneText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectedCountContainer}>
        <Text style={styles.selectedCountText}>
          {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      {allMedia.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="images-outline" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyStateTitle}>No photos in gallery</Text>
          <Text style={styles.emptyStateText}>
            Add photos to your gallery first
          </Text>
        </View>
      ) : (
        <FlatList
          data={allMedia}
          renderItem={({ item }) => {
            const isSelected = selectedPhotos.some(p => p.id === item.id);
            return (
              <TouchableOpacity
                style={styles.selectablePhotoItem}
                onPress={() => togglePhotoSelection(item)}
              >
                <Image source={{ uri: item.uri }} style={styles.selectablePhotoImage} />
                <View style={[styles.photoCheckbox, isSelected && styles.photoCheckboxSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.selectablePhotosGrid}
          columnWrapperStyle={styles.selectablePhotosRow}
        />
      )}
    </SafeAreaView>
  );
}

export default AddFromGalleryScreen;

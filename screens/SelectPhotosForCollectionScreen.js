import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';
import Header from '../components/Header';
import { STORAGE_KEYS } from '../constants/storageKeys';

function SelectPhotosForCollectionScreen({ navigation, route }) {
  const { collectionName } = route.params;
  const [allMedia, setAllMedia] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [importFromCameraRoll, setImportFromCameraRoll] = useState(false);

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

  const importFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map(asset => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: asset.uri,
        type: 'image',
      }));
      setSelectedPhotos([...selectedPhotos, ...newPhotos]);
      setImportFromCameraRoll(true);
    }
  };

  const createCollection = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please select at least one photo for the collection.');
      return;
    }

    try {
      const collectionsData = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      const collections = collectionsData ? JSON.parse(collectionsData) : [];

      const newCollection = {
        id: Date.now().toString(),
        name: collectionName,
        photos: selectedPhotos,
        createdAt: new Date().toISOString(),
      };

      collections.push(newCollection);
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));

      Alert.alert('Success', `Collection "${collectionName}" created!`);
      navigation.navigate('CollectionsList');
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'Failed to create collection.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        left={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
          </TouchableOpacity>
        }
        center={
          <Text style={styles.headerTitle}>Select Photos</Text>
        }
        right={
          <TouchableOpacity onPress={createCollection}>
            <Text style={styles.headerDoneText}>Done</Text>
          </TouchableOpacity>
        }
      />
      
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
            Import photos from your camera roll
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

      <TouchableOpacity style={styles.importFromCameraButton} onPress={importFromGallery}>
        <Ionicons name="cloud-upload-outline" size={20} color="white" />
        <Text style={styles.importFromCameraButtonText}>Import from Camera Roll</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default SelectPhotosForCollectionScreen;

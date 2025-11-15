import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { PRESET_TAGS, GALLERY_FILTER_TAGS } from '../constants/galleryTags';
import Header from '../components/Header';


function GalleryScreen({ navigation }) {
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [availableTags, setAvailableTags] = useState(['All']);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [photosToTag, setPhotosToTag] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [tagTags, setTagTags] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMedia();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterMedia();
  }, [media, searchQuery, selectedTag]);

  const loadMedia = async () => {
    try {
      const mediaData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      if (mediaData) {
        const loadedMedia = JSON.parse(mediaData);
        setMedia(loadedMedia);
        
        // Extract all unique tags
        const tags = new Set(['All']);
        loadedMedia.forEach(item => {
          item.tags?.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags));
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const filterMedia = () => {
    let filtered = [...media];

    // Filter by selected tag
    if (selectedTag !== 'All') {
      filtered = filtered.filter(m => m.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredMedia(filtered);
  };

  const uploadFromCameraRoll = async () => {
    setShowUploadOptions(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll access to import media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhotosToTag(result.assets);
      setCurrentPhotoIndex(0);
      setTagTags([]);
      setShowTagModal(true);
    }
  };

  const toggleTag = (tag) => {
    if (tagTags.includes(tag)) {
      setTagTags(tagTags.filter(t => t !== tag));
    } else {
      setTagTags([...tagTags, tag]);
    }
  };


  const saveCurrentPhoto = async () => {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      const existingMedia = existingData ? JSON.parse(existingData) : [];

      const currentPhoto = photosToTag[currentPhotoIndex];
      const newMedia = {
        id: Date.now().toString() + Math.random().toString(),
        uri: currentPhoto.uri,
        type: currentPhoto.type || 'image',
        tags: tagTags,
        createdAt: new Date().toISOString(),
      };

      existingMedia.push(newMedia);
      await AsyncStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(existingMedia));

      // Move to next photo or finish
      if (currentPhotoIndex < photosToTag.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
        setTagTags([]);
      } else {
        // All photos tagged
        setShowTagModal(false);
        setPhotosToTag([]);
        setCurrentPhotoIndex(0);
        loadMedia();
        Alert.alert('Success', `${photosToTag.length} photo(s) imported!`);
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo.');
    }
  };

  const skipPhoto = () => {
    if (currentPhotoIndex < photosToTag.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
      setTagTags([]);
    } else {
      setShowTagModal(false);
      setPhotosToTag([]);
      setCurrentPhotoIndex(0);
      loadMedia();
    }
  };

  const handlePhotoLongPress = (photo) => {
    setSelectionMode(true);
    setSelectedPhotos([photo]);
  };

 const handlePhotoPress = (photo) => {
    if (selectionMode) {
      togglePhotoSelection(photo);
    } else {
      navigation.navigate('MediaDetail', { media: photo, showAddButton: false });
    }
  };

 const togglePhotoSelection = (photo) => {
    if (selectedPhotos.some(p => p.id === photo.id)) {
      const newSelection = selectedPhotos.filter(p => p.id !== photo.id);
      setSelectedPhotos(newSelection);
      if (newSelection.length === 0) {
        setSelectionMode(false);
      }
    } else {
      setSelectedPhotos([...selectedPhotos, photo]);
    }
  };  

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedPhotos([]);
    };

  const deleteSelectedPhotos = () => {
    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedPhotos.length} photo${selectedPhotos.length !== 1 ? 's' : ''} permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const existingData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
              const existingMedia = existingData ? JSON.parse(existingData) : [];
              
              const selectedIds = selectedPhotos.map(p => p.id);
              const updatedMedia = existingMedia.filter(
                photo => !selectedIds.includes(photo.id)
              );

              await AsyncStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(updatedMedia));
              
              setSelectionMode(false);
              setSelectedPhotos([]);
              loadMedia();
              
              Alert.alert('Success', `${selectedIds.length} photo${selectedIds.length !== 1 ? 's' : ''} deleted!`);
            } catch (error) {
              console.error('Error deleting photos:', error);
              Alert.alert('Error', 'Failed to delete photos.');
            }
          }
        }
      ]
    );
  };

  const renderMediaItem = ({ item }) => {
  const isSelected = selectedPhotos.some(p => p.id === item.id);
  
  return (
    <TouchableOpacity 
      style={styles.galleryItem}
      onPress={() => handlePhotoPress(item)}
      onLongPress={() => handlePhotoLongPress(item)}
      delayLongPress={300}
    >
      <Image source={{ uri: item.uri }} style={styles.galleryImage} />
      {item.type === 'video' && (
        <View style={styles.videoIndicatorGallery}>
          <Ionicons name="play" size={20} color="white" />
        </View>
      )}
      {selectionMode && (
        <View style={[styles.photoSelectionCheckbox, isSelected && styles.photoSelectionCheckboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
        </View>
      )}
    </TouchableOpacity>
  );};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
       <Header
  left={
    selectionMode ? (
      <TouchableOpacity onPress={cancelSelection}>
        <Text style={styles.cancelSelectionText}>Cancel</Text>
      </TouchableOpacity>
    ) : null
  }
  center={
    selectionMode ? (
      <Text style={styles.selectionCountText}>
        {selectedPhotos.length} selected
      </Text>
    ) : (
      <Text style={styles.headerTitle}>FrameFlow</Text>
    )
  }
  right={
    selectionMode ? (
      <TouchableOpacity onPress={deleteSelectedPhotos}>
        <Ionicons name="trash-outline" size={24} color="#DC2626" />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity>
        <Ionicons name="notifications-outline" size={24} color="#3C3C3C" />
      </TouchableOpacity>
    )
  }
/>

      {/* Search Bar */}
      {!selectionMode && (<View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by tags..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color="#3C3C3C" />
        </TouchableOpacity>
      </View>
      )}

      {/* Tag Filter Pills */}
      {!selectionMode && ( <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {GALLERY_FILTER_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.categoryPill,
              selectedTag === tag && styles.categoryPillActive
            ]}
            onPress={() => setSelectedTag(tag)}
          >
            <Text style={[
              styles.categoryPillText,
              selectedTag === tag && styles.categoryPillTextActive
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      )}

      {/* Photos Header */}
      <View style={styles.photosHeader}>
        <Text style={styles.photosTitle}>All Photos</Text>
        <Text style={styles.photosCount}>{filteredMedia.length} photos</Text>
      </View>

      {/* Photo Grid */}
      {filteredMedia.length > 0 ? (
        <FlatList
          data={filteredMedia}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.galleryGrid}
          columnWrapperStyle={styles.galleryRow}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search-outline" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyStateTitle}>No saved photos yet</Text>
          <Text style={styles.emptyStateText}>
            Photos you save will appear here for easy access.
          </Text>
        </View>
      )}

      {/* Upload Button */}
    {!selectionMode ? (
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => setShowUploadOptions(!showUploadOptions)}
      >
        <Ionicons name="cloud-upload-outline" size={20} color="white" />
        <Text style={styles.uploadButtonText}>Upload Photo</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.deleteBar}>
        <Text style={styles.deleteBarText}>
          {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity style={styles.deleteBarButton} onPress={deleteSelectedPhotos}>
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.deleteBarButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    )}

      {/* Upload Options Modal */}
      {showUploadOptions && (
        <View style={styles.addOptionsOverlay}>
          <TouchableOpacity 
            style={styles.addOptionsBackdrop}
            onPress={() => setShowUploadOptions(false)}
            activeOpacity={1}
          />
          <View style={styles.addOptionsModal}>
            <View style={styles.addOptionsHandle} />
            <Text style={styles.addOptionsTitle}>Upload Photos</Text>
            
            <TouchableOpacity style={styles.addOptionItem} onPress={uploadFromCameraRoll}>
              <View style={styles.addOptionIcon}>
                <Ionicons name="phone-portrait-outline" size={24} color="#7D8F69" />
              </View>
              <View style={styles.addOptionText}>
                <Text style={styles.addOptionTitle}>From Camera Roll</Text>
                <Text style={styles.addOptionSubtitle}>Import and tag photos from your device</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tag Photo Modal */}
  {showTagModal && photosToTag.length > 0 && (
    <View style={styles.tagPhotoOverlay}>
      <View style={styles.tagPhotoModal}>
        {/* Header */}
        <View style={styles.tagPhotoHeader}>
          <Text style={styles.tagPhotoTitle}>Tag Photo</Text>
          <Text style={styles.tagPhotoCounter}>
            {currentPhotoIndex + 1} of {photosToTag.length}
          </Text>
        </View>

        {/* Photo Preview */}
        <View style={styles.tagPhotoPreview}>
          <Image 
            source={{ uri: photosToTag[currentPhotoIndex].uri }} 
            style={styles.tagPhotoImage}
            resizeMode="cover"
          />
        </View>

        {/* Tags Selection - ScrollView only for this section */}
        <ScrollView 
          style={styles.tagPhotoScrollSection}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tagPhotoSection}>

            {/* Preset Tags */}
            <Text style={styles.tagPhotoQuickAddLabel}>Select tags:</Text>
            <View style={styles.tagPhotoTagsGrid}>
              {PRESET_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagPhotoTag,
                    tagTags.includes(tag) && styles.tagPhotoTagSelected
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagPhotoTagText,
                    tagTags.includes(tag) && styles.tagPhotoTagTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

      {/* Action Buttons */}
      <View style={styles.tagPhotoActions}>
        <TouchableOpacity style={styles.tagPhotoSkipButton} onPress={skipPhoto}>
          <Text style={styles.tagPhotoSkipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tagPhotoSaveButton}
          onPress={saveCurrentPhoto}
        >
          <Text style={styles.tagPhotoSaveText}>
            {currentPhotoIndex < photosToTag.length - 1 ? 'Next' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
  )}
    </SafeAreaView>
  );
}

export default GalleryScreen;
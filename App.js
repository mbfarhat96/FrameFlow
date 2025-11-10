// App.js - FrameFlow with LensFlow Design
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from './components/error-boundary';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============================================
// DATA MANAGEMENT
// ============================================

const STORAGE_KEYS = {
  MEDIA: '@frameflow_media',
  COLLECTIONS: '@frameflow_collections',
};

const PRESET_TAGS = [
  'Bride', 'Groom', 'Couple', 'Family', 'Kids', 'Wedding', 'Portrait', 'Male', 'Female'
];

const GALLERY_FILTER_TAGS = [
  'All', 'Portrait', 'Wedding', 'Couple', 'Bride', 'Groom', 'Family', 'Kids', 'Male', 'Female'
];

// ============================================
// HOME SCREEN
// ============================================

function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ photos: 0, likes: 0, saved: 0 });
  const [collections, setCollections] = useState([]);
  const [allMedia, setAllMedia] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const mediaData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      if (mediaData) {
        const media = JSON.parse(mediaData);
        setAllMedia(media);
        setStats({
          photos: media.length,
          likes: Math.floor(media.length * 2.5),
          saved: Math.floor(media.length * 0.6)
        });

        // Group by first tag for collections
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
            <Ionicons name="camera-outline" size={24} color="#6B7280" />
            <Text style={styles.statNumber}>{stats.photos.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="heart-outline" size={24} color="#6B7280" />
            <Text style={styles.statNumber}>{stats.likes.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bookmark-outline" size={24} color="#6B7280" />
            <Text style={styles.statNumber}>{stats.saved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
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

// ============================================
// LIBRARY/GALLERY SCREEN
// ============================================

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
  const [customTagInput, setCustomTagInput] = useState('');

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
      setCustomTagInput('');
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

  const addCustomTag = () => {
    const trimmedTag = customTagInput.trim();
    if (trimmedTag && !tagTags.includes(trimmedTag)) {
      setTagTags([...tagTags, trimmedTag]);
      setCustomTagInput('');
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
        setCustomTagInput('');
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
      setCustomTagInput('');
    } else {
      setShowTagModal(false);
      setPhotosToTag([]);
      setCurrentPhotoIndex(0);
      loadMedia();
    }
  };

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.galleryItem}
      onPress={() => navigation.navigate('MediaDetail', { media: item, showAddButton: false })}
    >
      <Image source={{ uri: item.uri }} style={styles.galleryImage} />
      {item.type === 'video' && (
        <View style={styles.videoIndicatorGallery}>
          <Ionicons name="play" size={20} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

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

      {/* Search Bar */}
      <View style={styles.searchSection}>
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

      {/* Tag Filter Pills */}
      <ScrollView 
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
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => setShowUploadOptions(!showUploadOptions)}
      >
        <Ionicons name="cloud-upload-outline" size={20} color="white" />
        <Text style={styles.uploadButtonText}>Upload Photo</Text>
      </TouchableOpacity>

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

            {/* Tags Selection */}
            <View style={styles.tagPhotoSection}>
              <Text style={styles.tagPhotoLabel}>Add Tags</Text>
              
              {/* Custom Tag Input */}
              <View style={styles.tagPhotoCustomInput}>
                <TextInput
                  style={styles.tagPhotoInput}
                  placeholder="Type a custom tag..."
                  placeholderTextColor="#9CA3AF"
                  value={customTagInput}
                  onChangeText={setCustomTagInput}
                  onSubmitEditing={addCustomTag}
                  returnKeyType="done"
                />
                {customTagInput.trim() && (
                  <TouchableOpacity onPress={addCustomTag} style={styles.tagPhotoAddButton}>
                    <Ionicons name="add" size={20} color="#7D8F69" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected Tags */}
              {tagTags.length > 0 && (
                <View style={styles.tagPhotoSelectedTags}>
                  {tagTags.map((tag) => (
                    <View key={tag} style={styles.tagPhotoSelectedTag}>
                      <Text style={styles.tagPhotoSelectedTagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => toggleTag(tag)}>
                        <Ionicons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Preset Tags */}
              <Text style={styles.tagPhotoQuickAddLabel}>Quick add:</Text>
              <ScrollView 
                style={styles.tagPhotoTagsScroll}
                contentContainerStyle={styles.tagPhotoTagsGrid}
              >
                {PRESET_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagPhotoTag,
                      tagTags.includes(tag) && styles.tagPhotoTagDisabled
                    ]}
                    onPress={() => toggleTag(tag)}
                    disabled={tagTags.includes(tag)}
                  >
                    <Text style={[
                      styles.tagPhotoTagText,
                      tagTags.includes(tag) && styles.tagPhotoTagTextDisabled
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

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

// ============================================
// MEDIA DETAIL SCREEN
// ============================================

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

// ============================================
// ADD MEDIA FLOW
// ============================================

function AddMediaNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelectMedia" component={SelectMediaScreen} />
      <Stack.Screen name="TagMedia" component={TagMediaScreen} />
    </Stack.Navigator>
  );
}

function SelectMediaScreen({ navigation }) {
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll access to import media.');
      return false;
    }
    return true;
  };

  const pickMedia = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const mediaType = result.assets[0].type || 'image';
      navigation.navigate('TagMedia', { 
        media: result.assets, 
        mediaType 
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Media</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#3C3C3C" />
        </TouchableOpacity>
      </View>

      <View style={styles.addMediaContent}>
        <TouchableOpacity style={styles.addMediaButton} onPress={pickMedia}>
          <Ionicons name="cloud-upload-outline" size={32} color="white" />
          <Text style={styles.addMediaButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TagMediaScreen({ navigation, route }) {
  const { media, mediaType } = route.params;
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const importMedia = async () => {
    if (selectedTags.length === 0) {
      Alert.alert('Tags Required', 'Please select at least one tag.');
      return;
    }

    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      const existingMedia = existingData ? JSON.parse(existingData) : [];

      const newMedia = media.map((item) => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: item.uri,
        type: mediaType,
        tags: selectedTags,
        createdAt: new Date().toISOString(),
      }));

      await AsyncStorage.setItem(
        STORAGE_KEYS.MEDIA,
        JSON.stringify([...existingMedia, ...newMedia])
      );

      navigation.navigate('GalleryTab');
    } catch (error) {
      console.error('Error saving media:', error);
      Alert.alert('Error', 'Failed to save media.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tag Photos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.tagSection}>
          <Text style={styles.tagSectionLabel}>Tags</Text>
          <View style={styles.tagsGrid}>
            {PRESET_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagOption,
                  selectedTags.includes(tag) && styles.tagOptionSelected
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.tagOptionText,
                  selectedTags.includes(tag) && styles.tagOptionTextSelected
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.importActions}>
        <TouchableOpacity
          style={[styles.importButton, selectedTags.length === 0 && styles.importButtonDisabled]}
          onPress={importMedia}
          disabled={selectedTags.length === 0}
        >
          <Text style={styles.importButtonText}>Import {media.length} Photos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// COLLECTIONS SCREEN & CREATION FLOW
// ============================================

function CollectionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CollectionsList" component={CollectionsScreen} />
      <Stack.Screen name="CreateCollection" component={CreateCollectionScreen} />
      <Stack.Screen name="SelectPhotosForCollection" component={SelectPhotosForCollectionScreen} />
      <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
      <Stack.Screen name="AddFromGallery" component={AddFromGalleryScreen} />
    </Stack.Navigator>
  );
}

function CollectionsScreen({ navigation }) {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    loadCollections();
    const unsubscribe = navigation.addListener('focus', loadCollections);
    return unsubscribe;
  }, [navigation]);

  const loadCollections = async () => {
    try {
      const collectionsData = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (collectionsData) {
        setCollections(JSON.parse(collectionsData));
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
      </View>
      
      {collections.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyStateTitle}>No collections yet</Text>
          <Text style={styles.emptyStateText}>
            Create collections to organize your photos
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.collectionsListContent}>
          {collections.map((collection) => (
            <TouchableOpacity 
              key={collection.id} 
              style={styles.collectionListCard}
              onPress={() => navigation.navigate('CollectionDetail', { collection })}
            >
              <View style={styles.collectionListImageContainer}>
                {collection.photos && collection.photos.length > 0 ? (
                  <Image source={{ uri: collection.photos[0].uri }} style={styles.collectionListImage} />
                ) : (
                  <View style={styles.collectionListImageEmpty}>
                    <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View style={styles.collectionListInfo}>
                <Text style={styles.collectionListName}>{collection.name}</Text>
                <Text style={styles.collectionListCount}>{collection.photos?.length || 0} photos</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Create Collection Button */}
      <TouchableOpacity 
        style={styles.createCollectionButton}
        onPress={() => navigation.navigate('CreateCollection')}
      >
        <Ionicons name="add-outline" size={20} color="white" />
        <Text style={styles.createCollectionButtonText}>Create Collection</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function CreateCollectionScreen({ navigation }) {
  const [collectionName, setCollectionName] = useState('');

  const continueToPhotoSelection = () => {
    if (!collectionName.trim()) {
      Alert.alert('Name Required', 'Please enter a collection name.');
      return;
    }
    navigation.navigate('SelectPhotosForCollection', { collectionName: collectionName.trim() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Collection</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.createCollectionContent}>
        <View style={styles.createCollectionIconContainer}>
          <Ionicons name="folder-outline" size={64} color="#7D8F69" />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputSectionLabel}>Collection Name</Text>
          <TextInput
            style={styles.collectionNameInput}
            placeholder="e.g., Sarah's Wedding, Summer 2024"
            placeholderTextColor="#9CA3AF"
            value={collectionName}
            onChangeText={setCollectionName}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !collectionName.trim() && styles.continueButtonDisabled]}
          onPress={continueToPhotoSelection}
          disabled={!collectionName.trim()}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Photos</Text>
        <TouchableOpacity onPress={createCollection}>
          <Text style={styles.headerDoneText}>Done</Text>
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

function CollectionDetailScreen({ navigation, route }) {
  const { collection } = route.params;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredPhotos, setFilteredPhotos] = useState(collection.photos || []);
  const [availableTags, setAvailableTags] = useState([]);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    // Extract all unique tags from photos
    const tags = new Set(['All']);
    collection.photos?.forEach(photo => {
      photo.tags?.forEach(tag => tags.add(tag));
    });
    setAvailableTags(Array.from(tags));
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [selectedCategory]);

  const filterPhotos = () => {
    if (selectedCategory === 'All') {
      setFilteredPhotos(collection.photos || []);
    } else {
      const filtered = collection.photos?.filter(photo => 
        photo.tags?.includes(selectedCategory)
      ) || [];
      setFilteredPhotos(filtered);
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
      navigation.navigate('MediaDetailModal', { media: photo, showAddButton: false });
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
      `Are you sure you want to remove ${selectedPhotos.length} photo${selectedPhotos.length !== 1 ? 's' : ''} from this collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const collectionsData = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
              const collections = collectionsData ? JSON.parse(collectionsData) : [];
              
              const collectionIndex = collections.findIndex(c => c.id === collection.id);
              if (collectionIndex === -1) return;

              const selectedIds = selectedPhotos.map(p => p.id);
              collections[collectionIndex].photos = collections[collectionIndex].photos.filter(
                photo => !selectedIds.includes(photo.id)
              );

              await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
              
              setSelectionMode(false);
              setSelectedPhotos([]);
              
              navigation.replace('CollectionDetail', { 
                collection: collections[collectionIndex] 
              });
            } catch (error) {
              console.error('Error deleting photos:', error);
              Alert.alert('Error', 'Failed to delete photos.');
            }
          }
        }
      ]
    );
  };

  const addFromGallery = () => {
    setShowAddOptions(false);
    navigation.navigate('AddFromGallery', { collectionId: collection.id });
  };

  const addFromCameraRoll = async () => {
    setShowAddOptions(false);
    
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
      try {
        const collectionsData = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
        const collections = collectionsData ? JSON.parse(collectionsData) : [];
        
        const collectionIndex = collections.findIndex(c => c.id === collection.id);
        if (collectionIndex === -1) return;

        const newPhotos = result.assets.map(asset => ({
          id: Date.now().toString() + Math.random().toString(),
          uri: asset.uri,
          type: 'image',
          tags: [],
        }));

        collections[collectionIndex].photos = [
          ...collections[collectionIndex].photos,
          ...newPhotos
        ];

        await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
        
        Alert.alert('Success', `${newPhotos.length} photo(s) added to collection!`);
        navigation.replace('CollectionDetail', { 
          collection: collections[collectionIndex] 
        });
      } catch (error) {
        console.error('Error adding photos:', error);
        Alert.alert('Error', 'Failed to add photos to collection.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.collectionDetailHeader}>
        {selectionMode ? (
          <>
            <TouchableOpacity onPress={cancelSelection}>
              <Text style={styles.cancelSelectionText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.selectionCountText}>
              {selectedPhotos.length} selected
            </Text>
            <TouchableOpacity onPress={deleteSelectedPhotos}>
              <Ionicons name="trash-outline" size={24} color="#DC2626" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={24} color="#3C3C3C" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Collection Name */}
        {!selectionMode && (
          <View style={styles.collectionDetailTitleContainer}>
            <Text style={styles.collectionDetailTitle}>{collection.name}</Text>
          </View>
        )}

        {/* Category Pills */}
        {!selectionMode && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.categoryPill,
                  selectedCategory === tag && styles.categoryPillActive
                ]}
                onPress={() => setSelectedCategory(tag)}
              >
                <Text style={[
                  styles.categoryPillText,
                  selectedCategory === tag && styles.categoryPillTextActive
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
          <Text style={styles.photosCount}>{filteredPhotos.length} photos</Text>
        </View>

        {/* Photos Grid or Empty State */}
        {filteredPhotos.length > 0 ? (
          <View style={styles.collectionDetailGrid}>
            {filteredPhotos.map((photo, index) => {
              const isSelected = selectedPhotos.some(p => p.id === photo.id);
              return (
                <TouchableOpacity
                  key={photo.id || index}
                  style={styles.collectionDetailPhotoItem}
                  onPress={() => handlePhotoPress(photo)}
                  onLongPress={() => handlePhotoLongPress(photo)}
                  delayLongPress={300}
                >
                  <Image source={{ uri: photo.uri }} style={styles.collectionDetailPhotoImage} />
                  {selectionMode && (
                    <View style={[styles.photoSelectionCheckbox, isSelected && styles.photoSelectionCheckboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.collectionDetailEmpty}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="image-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyStateTitle}>No photos in this category</Text>
            <Text style={styles.emptyStateText}>
              Try selecting a different category.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Photo Button or Delete Bar */}
      {!selectionMode ? (
        <TouchableOpacity 
          style={styles.addPhotoButton}
          onPress={() => setShowAddOptions(!showAddOptions)}
        >
          <Ionicons name="add-outline" size={20} color="white" />
          <Text style={styles.addPhotoButtonText}>Add Photo</Text>
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

      {/* Add Options Modal */}
      {showAddOptions && (
        <View style={styles.addOptionsOverlay}>
          <TouchableOpacity 
            style={styles.addOptionsBackdrop}
            onPress={() => setShowAddOptions(false)}
            activeOpacity={1}
          />
          <View style={styles.addOptionsModal}>
            <View style={styles.addOptionsHandle} />
            <Text style={styles.addOptionsTitle}>Add Photos</Text>
            
            <TouchableOpacity style={styles.addOptionItem} onPress={addFromGallery}>
              <View style={styles.addOptionIcon}>
                <Ionicons name="image-outline" size={24} color="#7D8F69" />
              </View>
              <View style={styles.addOptionText}>
                <Text style={styles.addOptionTitle}>From App Gallery</Text>
                <Text style={styles.addOptionSubtitle}>Choose from your tagged photos</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.addOptionItem} onPress={addFromCameraRoll}>
              <View style={styles.addOptionIcon}>
                <Ionicons name="phone-portrait-outline" size={24} color="#7D8F69" />
              </View>
              <View style={styles.addOptionText}>
                <Text style={styles.addOptionTitle}>From Camera Roll</Text>
                <Text style={styles.addOptionSubtitle}>Import from your device</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

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

// ============================================
// PROFILE SCREEN
// ============================================

function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="person-outline" size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyStateTitle}>Profile</Text>
        <Text style={styles.emptyStateText}>
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// NAVIGATION
// ============================================

function GalleryStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen 
        name="MediaDetail" 
        component={MediaDetailScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6B7280',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: {
          marginBottom: -4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'GalleryTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'CollectionsTab') iconName = focused ? 'folder' : 'folder-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
      tabBar={(props) => (
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBarContent}>
            {props.state.routes.map((route, index) => {
              if (route.name === 'AddTab') return null;
              
              const { options } = props.descriptors[route.key];
              const label = options.tabBarLabel;
              const isFocused = props.state.index === index;

              const onPress = () => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name);
                }
              };

              let iconName;
              if (route.name === 'HomeTab') iconName = isFocused ? 'home' : 'home-outline';
              else if (route.name === 'GalleryTab') iconName = isFocused ? 'grid' : 'grid-outline';
              else if (route.name === 'CollectionsTab') iconName = isFocused ? 'folder' : 'folder-outline';
              else if (route.name === 'ProfileTab') iconName = isFocused ? 'person' : 'person-outline';

              const color = isFocused ? '#6B7280' : '#9CA3AF';

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.customTabItem}
                >
                  <Ionicons name={iconName} size={24} color={color} />
                  <Text style={[styles.customTabLabel, { color }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="GalleryTab" component={GalleryStackNavigator} options={{ tabBarLabel: 'Gallery' }} />
      <Tab.Screen name="CollectionsTab" component={CollectionsNavigator} options={{ tabBarLabel: 'Collections' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
      <Tab.Screen 
        name="AddTab" 
        component={AddMediaNavigator} 
        options={{ 
          tabBarButton: () => null,
        }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen 
            name="MediaDetailModal" 
            component={MediaDetailScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EFE7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F5F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3C3C3C',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Collections
  collectionsScroll: {
    paddingLeft: 20,
  },
  collectionCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionImageEmpty: {
    backgroundColor: '#E8DFD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  collectionCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  emptyCollections: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  // Explore
  emptyExplore: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyExploreText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
  },
  // Gallery Screen
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3C3C3C',
  },
  filterButton: {
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Categories
  categoriesScroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F5F0',
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  categoryPillActive: {
    backgroundColor: '#7D8F69',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#3C3C3C',
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: 'white',
  },
  // Photos Header
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  photosCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Gallery Grid
  galleryGrid: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  galleryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  galleryItem: {
    width: (Dimensions.get('window').width - 52) / 2,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8DFD3',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicatorGallery: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F9F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Upload Button
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#7D8F69',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Create Collection Button
  createCollectionButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#7D8F69',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createCollectionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Collection Creation Screens
  createCollectionContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  createCollectionIconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  inputSectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 12,
  },
  collectionNameInput: {
    backgroundColor: '#F9F5F0',
    borderWidth: 1,
    borderColor: '#E8DFD3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3C3C3C',
  },
  continueButton: {
    backgroundColor: '#7D8F69',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1C7B7',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerDoneText: {
    color: '#7D8F69',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9F5F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD3',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#3C3C3C',
    fontWeight: '500',
  },
  selectablePhotosGrid: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  selectablePhotosRow: {
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  selectablePhotoItem: {
    width: (Dimensions.get('window').width - 56) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  selectablePhotoImage: {
    width: '100%',
    height: '100%',
  },
  photoCheckbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCheckboxSelected: {
    backgroundColor: '#7D8F69',
    borderColor: '#7D8F69',
  },
  importFromCameraButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#7D8F69',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  importFromCameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  collectionsListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  collectionListCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  collectionListImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  collectionListImage: {
    width: '100%',
    height: '100%',
  },
  collectionListImageEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8DFD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionListInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  collectionListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 4,
  },
  collectionListCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Collection Detail Screen
  collectionDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  collectionDetailTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  collectionDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3C3C3C',
  },
  collectionDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  collectionDetailPhotoItem: {
    width: (Dimensions.get('window').width - 64) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  collectionDetailPhotoImage: {
    width: '100%',
    height: '100%',
  },
  collectionDetailEmpty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  // Add Photo Button & Modal
  addPhotoButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#7D8F69',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addPhotoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  addOptionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addOptionsModal: {
    backgroundColor: '#F5EFE7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  addOptionsHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1C7B7',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  addOptionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3C3C3C',
    marginBottom: 20,
  },
  addOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  addOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(125, 143, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addOptionText: {
    flex: 1,
  },
  addOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 2,
  },
  addOptionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  // Selection Mode
  cancelSelectionText: {
    fontSize: 16,
    color: '#7D8F69',
    fontWeight: '600',
  },
  selectionCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  photoSelectionCheckbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSelectionCheckboxSelected: {
    backgroundColor: '#7D8F69',
    borderColor: '#7D8F69',
  },
  deleteBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteBarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tag Photo Modal
  tagPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tagPhotoModal: {
    backgroundColor: '#F5EFE7',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
  },
  tagPhotoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD3',
  },
  tagPhotoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3C3C3C',
  },
  tagPhotoCounter: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tagPhotoPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E8DFD3',
  },
  tagPhotoImage: {
    width: '100%',
    height: '100%',
  },
  tagPhotoSection: {
    padding: 20,
  },
  tagPhotoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 12,
  },
  tagPhotoCustomInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5F0',
    borderWidth: 1,
    borderColor: '#E8DFD3',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tagPhotoInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#3C3C3C',
  },
  tagPhotoAddButton: {
    padding: 4,
  },
  tagPhotoSelectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagPhotoSelectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D8F69',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  tagPhotoSelectedTagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tagPhotoQuickAddLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  tagPhotoTagsScroll: {
    maxHeight: 150,
  },
  tagPhotoTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPhotoTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F9F5F0',
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  tagPhotoTagDisabled: {
    backgroundColor: '#E8DFD3',
    opacity: 0.5,
  },
  tagPhotoTagText: {
    fontSize: 14,
    color: '#3C3C3C',
    fontWeight: '500',
  },
  tagPhotoTagTextDisabled: {
    color: '#9CA3AF',
  },
  tagPhotoActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  tagPhotoSkipButton: {
    flex: 1,
    backgroundColor: '#F9F5F0',
    borderWidth: 1,
    borderColor: '#E8DFD3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tagPhotoSkipText: {
    color: '#3C3C3C',
    fontSize: 16,
    fontWeight: '600',
  },
  tagPhotoSaveButton: {
    flex: 1,
    backgroundColor: '#7D8F69',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tagPhotoSaveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Media Detail Screen
  mediaDetailContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaDetailImage: {
    width: '100%',
    height: '100%',
  },
  mediaDetailDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mediaDetailTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  mediaDetailBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaDetailBottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tagsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7D8F69',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Tags Sheet
  tagsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5EFE7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  tagsSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1C7B7',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  tagsSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 16,
  },
  tagsSheetContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#7D8F69',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagChipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tagsSheetInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8DFD3',
  },
  tagsSheetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 4,
  },
  tagsSheetDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Add Media Screen
  addMediaContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  addMediaButton: {
    backgroundColor: '#7D8F69',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addMediaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tag Media Screen
  tagSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tagSectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
    marginBottom: 12,
  },
  categorySelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  categorySelectText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  categorySelectTextFilled: {
    fontSize: 14,
    color: '#3C3C3C',
    fontWeight: '500',
  },
  categoryDropdown: {
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD3',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#3C3C3C',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F9F5F0',
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  tagOptionSelected: {
    backgroundColor: '#7D8F69',
    borderColor: '#7D8F69',
  },
  tagOptionText: {
    fontSize: 14,
    color: '#3C3C3C',
    fontWeight: '500',
  },
  tagOptionTextSelected: {
    color: 'white',
  },
  importActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8DFD3',
  },
  importButton: {
    backgroundColor: '#7D8F69',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  importButtonDisabled: {
    backgroundColor: '#D1C7B7',
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tab Bar
  tabBar: {
    backgroundColor: '#F5EFE7',
    borderTopWidth: 1,
    borderTopColor: '#E8DFD3',
    paddingTop: 8,
    paddingBottom: 20,
    height: 80,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tabBarItem: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: '#F5EFE7',
    borderTopWidth: 1,
    borderTopColor: '#E8DFD3',
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    height: 80,
  },
  customTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
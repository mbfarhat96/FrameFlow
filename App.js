// App.js - Main FrameFlow Application
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============================================
// DATA MANAGEMENT
// ============================================

const STORAGE_KEYS = {
  MEDIA: '@frameflow_media',
  COLLECTIONS: '@frameflow_collections',
  TAGS: '@frameflow_tags'
};

const CATEGORIES = [
  'Wedding', 'Portrait', 'Event', 'Product', 'Real Estate',
  'Fashion', 'Sports', 'Landscape', 'Food', 'Documentary'
];

const PRESET_TAGS = {
  subject: ['Bride', 'Groom', 'Couple', 'Family', 'Kids', 'Solo Male', 'Solo Female', 'Product', 'Architecture', 'Details'],
  style: ['Candid', 'Posed', 'Dramatic', 'Minimalist', 'Moody', 'Bright', 'Cinematic', 'Documentary'],
  technical: ['Indoor', 'Outdoor', 'Studio', 'Natural Light', 'Golden Hour', 'Low Light', 'Drone', 'Slow Motion']
};

// ============================================
// HOME SCREEN
// ============================================

function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ photos: 0, videos: 0 });
  const [recentTags, setRecentTags] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const mediaData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      if (mediaData) {
        const media = JSON.parse(mediaData);
        const photos = media.filter(m => m.type === 'image').length;
        const videos = media.filter(m => m.type === 'video').length;
        setStats({ photos, videos });

        // Get recent tags
        const allTags = media.flatMap(m => m.tags || []);
        const uniqueTags = [...new Set(allTags)].slice(0, 6);
        setRecentTags(uniqueTags);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FrameFlow</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category or tags..."
            placeholderTextColor="#94a3b8"
            onFocus={() => navigation.navigate('Library')}
          />
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIBRARY STATS</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPurple]}>
              <Ionicons name="camera" size={24} color="#c084fc" />
              <Text style={styles.statNumber}>{stats.photos}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={[styles.statCard, styles.statCardPink]}>
              <Ionicons name="videocam" size={24} color="#f472b6" />
              <Text style={styles.statNumber}>{stats.videos}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BROWSE BY CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Library', { category: cat })}
              >
                <Text style={styles.categoryName}>{cat}</Text>
                <Text style={styles.categoryCount}>
                  {Math.floor(Math.random() * 50) + 10} items
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Tags */}
        {recentTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POPULAR TAGS</Text>
            <View style={styles.tagsContainer}>
              {recentTags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// LIBRARY SCREEN
// ============================================

function LibraryScreen({ navigation, route }) {
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'all');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadMedia();
    const unsubscribe = navigation.addListener('focus', loadMedia);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterMedia();
  }, [media, selectedCategory, selectedTags]);

  const loadMedia = async () => {
    try {
      const mediaData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      if (mediaData) {
        setMedia(JSON.parse(mediaData));
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const filterMedia = () => {
    let filtered = [...media];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(m => 
        selectedTags.some(tag => m.tags?.includes(tag))
      );
    }

    setFilteredMedia(filtered);
  };

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity style={styles.mediaItem}>
      <Image source={{ uri: item.uri }} style={styles.mediaImage} />
      {item.type === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="videocam" size={16} color="white" />
        </View>
      )}
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaCategory}>{item.category}</Text>
        <View style={styles.mediaTags}>
          {item.tags?.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.mediaTag}>
              <Text style={styles.mediaTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      <View style={styles.libraryControls}>
        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('Filter', { 
            selectedCategory, 
            selectedTags,
            onApply: (category, tags) => {
              setSelectedCategory(category);
              setSelectedTags(tags);
            }
          })}
        >
          <Ionicons name="filter" size={20} color="#c084fc" />
          <Text style={styles.filterButtonText}>
            {selectedCategory !== 'all' ? selectedCategory : 'All Categories'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <View style={styles.selectedTags}>
            {selectedTags.map((tag) => (
              <View key={tag} style={styles.selectedTag}>
                <Text style={styles.selectedTagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <Ionicons name="close" size={14} color="#e9d5ff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filteredMedia}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.mediaGrid}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>No media yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add photos or videos
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ============================================
// FILTER SCREEN
// ============================================

function FilterScreen({ navigation, route }) {
  const [selectedCategory, setSelectedCategory] = useState(route.params?.selectedCategory || 'all');
  const [selectedTags, setSelectedTags] = useState(route.params?.selectedTags || []);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const applyFilters = () => {
    route.params?.onApply(selectedCategory, selectedTags);
    navigation.goBack();
  };

  const clearAll = () => {
    setSelectedCategory('all');
    setSelectedTags([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Category */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Category</Text>
          <TouchableOpacity
            style={[styles.filterOption, selectedCategory === 'all' && styles.filterOptionSelected]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterOptionText, selectedCategory === 'all' && styles.filterOptionTextSelected]}>
              All Categories
            </Text>
            {selectedCategory === 'all' && <Ionicons name="checkmark" size={20} color="#e9d5ff" />}
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterOption, selectedCategory === cat && styles.filterOptionSelected]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterOptionText, selectedCategory === cat && styles.filterOptionTextSelected]}>
                {cat}
              </Text>
              {selectedCategory === cat && <Ionicons name="checkmark" size={20} color="#e9d5ff" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Tags</Text>
          <View style={styles.filterTags}>
            {[...PRESET_TAGS.subject, ...PRESET_TAGS.style, ...PRESET_TAGS.technical].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.filterTag, selectedTags.includes(tag) && styles.filterTagSelected]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.filterTagText, selectedTags.includes(tag) && styles.filterTagTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.filterActions}>
        <TouchableOpacity style={styles.filterActionSecondary} onPress={clearAll}>
          <Text style={styles.filterActionSecondaryText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterActionPrimary} onPress={applyFilters}>
          <Text style={styles.filterActionPrimaryText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// ADD MEDIA SCREEN
// ============================================

function AddMediaNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelectMedia" component={SelectMediaScreen} />
      <Stack.Screen name="TagMedia" component={TagMediaScreen} />
      <Stack.Screen name="ImportSuccess" component={ImportSuccessScreen} />
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

  const pickImages = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate('TagMedia', { media: result.assets, mediaType: 'image' });
    }
  };

  const pickVideos = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate('TagMedia', { media: result.assets, mediaType: 'video' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Media</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.addMediaContent}>
        <Text style={styles.addMediaSubtitle}>Choose what to import</Text>

        <TouchableOpacity style={styles.addMediaButtonPurple} onPress={pickImages}>
          <View style={styles.addMediaIcon}>
            <Ionicons name="image" size={28} color="white" />
          </View>
          <View style={styles.addMediaTextContainer}>
            <Text style={styles.addMediaTitle}>Import Photos</Text>
            <Text style={styles.addMediaDescription}>From camera roll</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addMediaButtonPink} onPress={pickVideos}>
          <View style={styles.addMediaIcon}>
            <Ionicons name="videocam" size={28} color="white" />
          </View>
          <View style={styles.addMediaTextContainer}>
            <Text style={styles.addMediaTitle}>Import Videos</Text>
            <Text style={styles.addMediaDescription}>From camera roll</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 <Text style={styles.tipBold}>Tip:</Text> You can select multiple files and apply tags to all of them at once
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TagMediaScreen({ navigation, route }) {
  const { media, mediaType } = route.params;
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const importMedia = async () => {
    if (!category) {
      Alert.alert('Category Required', 'Please select a category for your media.');
      return;
    }

    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA);
      const existingMedia = existingData ? JSON.parse(existingData) : [];

      const newMedia = media.map((item) => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: item.uri,
        type: mediaType,
        category: category,
        tags: selectedTags,
        createdAt: new Date().toISOString(),
      }));

      await AsyncStorage.setItem(
        STORAGE_KEYS.MEDIA,
        JSON.stringify([...existingMedia, ...newMedia])
      );

      navigation.navigate('ImportSuccess', { category, count: media.length });
    } catch (error) {
      console.error('Error saving media:', error);
      Alert.alert('Error', 'Failed to save media. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tag Media</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Selected Files Info */}
        <View style={styles.selectedFilesCard}>
          <View style={styles.selectedFilesIcon}>
            <Ionicons 
              name={mediaType === 'image' ? 'image' : 'videocam'} 
              size={24} 
              color={mediaType === 'image' ? '#c084fc' : '#f472b6'} 
            />
          </View>
          <View>
            <Text style={styles.selectedFilesTitle}>{media.length} files selected</Text>
            <Text style={styles.selectedFilesSubtitle}>Ready to tag</Text>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={category ? styles.selectInputTextSelected : styles.selectInputText}>
              {category || 'Select category...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.categoryDropdown}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategories(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Type and press Enter..."
              placeholderTextColor="#94a3b8"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
            />
          </View>

          {selectedTags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              {selectedTags.map((tag) => (
                <View key={tag} style={styles.selectedTagPill}>
                  <Text style={styles.selectedTagPillText}>{tag}</Text>
                  <TouchableOpacity onPress={() => toggleTag(tag)}>
                    <Ionicons name="close" size={14} color="#e9d5ff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.quickAddLabel}>Quick add:</Text>
          <View style={styles.quickAddTags}>
            {PRESET_TAGS.subject.slice(0, 6).map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.quickAddTag, selectedTags.includes(tag) && styles.quickAddTagDisabled]}
                onPress={() => !selectedTags.includes(tag) && toggleTag(tag)}
                disabled={selectedTags.includes(tag)}
              >
                <Text style={[styles.quickAddTagText, selectedTags.includes(tag) && styles.quickAddTagTextDisabled]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.tagMediaActions}>
        <TouchableOpacity style={styles.tagActionSecondary} onPress={() => navigation.goBack()}>
          <Text style={styles.tagActionSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tagActionPrimary, !category && styles.tagActionPrimaryDisabled]}
          onPress={importMedia}
          disabled={!category}
        >
          <Text style={styles.tagActionPrimaryText}>Import</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ImportSuccessScreen({ navigation, route }) {
  const { category, count } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.scrollView, styles.successContainer]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color="white" />
        </View>
        <Text style={styles.successTitle}>All Set!</Text>
        <Text style={styles.successMessage}>
          {count} files imported to <Text style={styles.successCategory}>{category}</Text>
        </Text>
        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.successActionSecondary}
            onPress={() => navigation.navigate('SelectMedia')}
          >
            <Text style={styles.successActionSecondaryText}>Import More</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successActionPrimary}
            onPress={() => navigation.navigate('LibraryTab')}
          >
            <Text style={styles.successActionPrimaryText}>View Library</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// COLLECTIONS SCREEN
// ============================================

function CollectionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Shoots</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.newCollectionButton}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.newCollectionButtonText}>New Collection</Text>
        </TouchableOpacity>

        <View style={styles.collectionCard}>
          <View style={styles.collectionHeader}>
            <Text style={styles.collectionTitle}>Sample Collection</Text>
            <View style={styles.collectionBadge}>
              <Text style={styles.collectionBadgeText}>Upcoming</Text>
            </View>
          </View>
          <View style={styles.collectionStats}>
            <View style={styles.collectionStat}>
              <Ionicons name="camera" size={16} color="#94a3b8" />
              <Text style={styles.collectionStatText}>0 photos</Text>
            </View>
            <View style={styles.collectionStat}>
              <Ionicons name="videocam" size={16} color="#94a3b8" />
              <Text style={styles.collectionStatText}>0 videos</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="folder-outline" size={64} color="#475569" />
          <Text style={styles.emptyStateText}>No collections yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create collections to organize your shoot references
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// MAIN APP NAVIGATION
// ============================================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#c084fc',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'LibraryTab') iconName = 'grid';
          else if (route.name === 'AddTab') iconName = 'add';
          else if (route.name === 'CollectionsTab') iconName = 'folder-open';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="LibraryTab" component={LibraryStackNavigator} options={{ tabBarLabel: 'Library' }} />
      <Tab.Screen 
        name="AddTab" 
        component={AddMediaNavigator} 
        options={{ 
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.addTabButton}>
              <Ionicons name="add" size={32} color="white" />
            </View>
          ),
        }} 
      />
      <Tab.Screen name="CollectionsTab" component={CollectionsScreen} options={{ tabBarLabel: 'Shoots' }} />
    </Tab.Navigator>
  );
}

function LibraryStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Filter" component={FilterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 16,
    paddingVertical: 14,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statCardPurple: {
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  statCardPink: {
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
    borderColor: 'rgba(244, 114, 182, 0.3)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#64748b',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagText: {
    color: '#475569',
    fontSize: 14,
  },
  libraryControls: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    flex: 1,
    marginLeft: 8,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  selectedTagText: {
    color: '#e9d5ff',
    fontSize: 14,
  },
  mediaGrid: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  mediaItem: {
    width: (Dimensions.get('window').width - 60) / 2,
    marginBottom: 12,
    marginHorizontal: 6,
  },
  mediaImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaInfo: {
    marginTop: 8,
  },
  mediaCategory: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  mediaTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  mediaTag: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mediaTagText: {
    fontSize: 10,
    color: '#c084fc',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 48,
  },
  filterSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: '#a855f7',
  },
  filterOptionText: {
    color: '#475569',
    fontSize: 16,
  },
  filterOptionTextSelected: {
    color: '#a855f7',
    fontWeight: '500',
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTag: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterTagSelected: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  filterTagText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTagTextSelected: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  filterActionSecondary: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterActionSecondaryText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
  },
  filterActionPrimary: {
    flex: 1,
    backgroundColor: '#a855f7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterActionPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addMediaContent: {
    padding: 24,
  },
  addMediaSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  addMediaButtonPurple: {
    backgroundColor: '#a855f7',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMediaButtonPink: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  addMediaIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addMediaTextContainer: {
    flex: 1,
  },
  addMediaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  addMediaDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tipBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
  },
  tipBold: {
    fontWeight: '600',
    color: '#0f172a',
  },
  selectedFilesCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedFilesIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedFilesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  selectedFilesSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  inputSection: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  required: {
    color: '#c084fc',
  },
  selectInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInputText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  selectInputTextSelected: {
    color: '#0f172a',
    fontSize: 16,
  },
  categoryDropdown: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryOptionText: {
    color: '#0f172a',
    fontSize: 16,
  },
  tagInputContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  tagInput: {
    color: '#0f172a',
    fontSize: 16,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  selectedTagPillText: {
    color: '#e9d5ff',
    fontSize: 14,
  },
  quickAddLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  quickAddTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddTag: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickAddTagDisabled: {
    backgroundColor: '#f1f5f9',
  },
  quickAddTagText: {
    color: '#475569',
    fontSize: 12,
  },
  quickAddTagTextDisabled: {
    color: '#94a3b8',
  },
  tagMediaActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tagActionSecondary: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tagActionSecondaryText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
  },
  tagActionPrimary: {
    flex: 1,
    backgroundColor: '#a855f7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tagActionPrimaryDisabled: {
    backgroundColor: '#cbd5e1',
  },
  tagActionPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  successCategory: {
    color: '#c084fc',
    fontWeight: '600',
  },
  successActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  successActionSecondary: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  successActionSecondaryText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
  },
  successActionPrimary: {
    flex: 1,
    backgroundColor: '#a855f7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  successActionPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  newCollectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a855f7',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  newCollectionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  collectionCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  collectionBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  collectionBadgeText: {
    fontSize: 12,
    color: '#4ade80',
  },
  collectionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  collectionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectionStatText: {
    fontSize: 14,
    color: '#64748b',
  },
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 8,
    height: 68,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  addTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
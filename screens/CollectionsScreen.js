import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';
import Header from '../components/Header';
import { STORAGE_KEYS } from '../constants/storageKeys';

function CollectionsScreen({ navigation }) {
  const [collections, setCollections] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([]);

  useEffect(() => {
    loadCollections();
    const unsubscribe = navigation.addListener('focus', loadCollections);
    return unsubscribe;
  }, [navigation]);

  const handleCollectionLongPress = (collection) => {
  setSelectionMode(true);
  setSelectedCollections([collection]);
};

const handleCollectionPress = (collection) => {
  if (selectionMode) {
    toggleCollectionSelection(collection);
  } else {
    navigation.navigate('CollectionDetail', { collection });
  }
};

const toggleCollectionSelection = (collection) => {
  if (selectedCollections.some(c => c.id === collection.id)) {
    const newSelection = selectedCollections.filter(c => c.id !== collection.id);
    setSelectedCollections(newSelection);
    if (newSelection.length === 0) {
      setSelectionMode(false);
    }
  } else {
    setSelectedCollections([...selectedCollections, collection]);
  }
};

const cancelSelection = () => {
  setSelectionMode(false);
  setSelectedCollections([]);
};

const deleteSelectedCollections = () => {
  Alert.alert(
    'Delete Collections',
    `Are you sure you want to delete ${selectedCollections.length} collection${selectedCollections.length !== 1 ? 's' : ''}? This will not delete the photos, only the collections.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const collectionsData = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
            const collections = collectionsData ? JSON.parse(collectionsData) : [];
            
            const selectedIds = selectedCollections.map(c => c.id);
            const updatedCollections = collections.filter(
              collection => !selectedIds.includes(collection.id)
            );

            await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(updatedCollections));
            
            setSelectionMode(false);
            setSelectedCollections([]);
            loadCollections();
            
            Alert.alert('Success', `${selectedIds.length} collection${selectedIds.length !== 1 ? 's' : ''} deleted!`);
          } catch (error) {
            console.error('Error deleting collections:', error);
            Alert.alert('Error', 'Failed to delete collections.');
          }
        }
      }
    ]
  );
};

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
            {selectedCollections.length} selected
          </Text>
        ) : (
          <Text style={styles.headerTitle}>Collections</Text>
        )
      }
      right={
        selectionMode ? (
          <TouchableOpacity onPress={deleteSelectedCollections}>
            <Ionicons name="trash-outline" size={24} color="#DC2626" />
          </TouchableOpacity>
        ) : null
      }
    />
      
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
    {collections.map((collection) => {
      const isSelected = selectedCollections.some(c => c.id === collection.id);
      
      return (
        <TouchableOpacity 
          key={collection.id} 
          style={styles.collectionListCard}
          onPress={() => handleCollectionPress(collection)}
          onLongPress={() => handleCollectionLongPress(collection)}
          delayLongPress={300}
        >
          <View style={styles.collectionListImageContainer}>
            {collection.photos && collection.photos.length > 0 ? (
              <Image source={{ uri: collection.photos[0].uri }} style={styles.collectionListImage} />
            ) : (
              <View style={styles.collectionListImageEmpty}>
                <Ionicons name="images-outline" size={32} color="#9CA3AF" />
              </View>
            )}
            {selectionMode && (
              <View style={[styles.collectionSelectionCheckbox, isSelected && styles.collectionSelectionCheckboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            )}
          </View>
          <View style={styles.collectionListInfo}>
            <Text style={styles.collectionListName}>{collection.name}</Text>
            <Text style={styles.collectionListCount}>{collection.photos?.length || 0} photos</Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
)}

      {/* Create Collection Button or Delete Bar */}
    {!selectionMode ? (
      <TouchableOpacity 
        style={styles.createCollectionButton}
        onPress={() => navigation.navigate('CreateCollection')}
      >
        <Ionicons name="add-outline" size={20} color="white" />
        <Text style={styles.createCollectionButtonText}>Create Collection</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.deleteBar}>
        <Text style={styles.deleteBarText}>
          {selectedCollections.length} collection{selectedCollections.length !== 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity style={styles.deleteBarButton} onPress={deleteSelectedCollections}>
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.deleteBarButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    )}
    </SafeAreaView>
  );
}

export default CollectionsScreen
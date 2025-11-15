import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/globalStyles";
import Header from '../components/Header';
import { STORAGE_KEYS } from "../constants/storageKeys";

function CollectionDetailScreen({ navigation, route }) {
  const { collection } = route.params;
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredPhotos, setFilteredPhotos] = useState(collection.photos || []);
  const [availableTags, setAvailableTags] = useState([]);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    // Extract all unique tags from photos
    const tags = new Set(["All"]);
    collection.photos?.forEach((photo) => {
      photo.tags?.forEach((tag) => tags.add(tag));
    });
    setAvailableTags(Array.from(tags));
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [selectedCategory]);

  const filterPhotos = () => {
    if (selectedCategory === "All") {
      setFilteredPhotos(collection.photos || []);
    } else {
      const filtered =
        collection.photos?.filter((photo) =>
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
      navigation.navigate("MediaDetailModal", {
        media: photo,
        showAddButton: false,
      });
    }
  };

  const togglePhotoSelection = (photo) => {
    if (selectedPhotos.some((p) => p.id === photo.id)) {
      const newSelection = selectedPhotos.filter((p) => p.id !== photo.id);
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
      "Delete Photos",
      `Are you sure you want to remove ${selectedPhotos.length} photo${
        selectedPhotos.length !== 1 ? "s" : ""
      } from this collection?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const collectionsData = await AsyncStorage.getItem(
                STORAGE_KEYS.COLLECTIONS
              );
              const collections = collectionsData
                ? JSON.parse(collectionsData)
                : [];

              const collectionIndex = collections.findIndex(
                (c) => c.id === collection.id
              );
              if (collectionIndex === -1) return;

              const selectedIds = selectedPhotos.map((p) => p.id);
              collections[collectionIndex].photos = collections[
                collectionIndex
              ].photos.filter((photo) => !selectedIds.includes(photo.id));

              await AsyncStorage.setItem(
                STORAGE_KEYS.COLLECTIONS,
                JSON.stringify(collections)
              );

              setSelectionMode(false);
              setSelectedPhotos([]);

              navigation.replace("CollectionDetail", {
                collection: collections[collectionIndex],
              });
            } catch (error) {
              console.error("Error deleting photos:", error);
              Alert.alert("Error", "Failed to delete photos.");
            }
          },
        },
      ]
    );
  };

  const addFromGallery = () => {
    setShowAddOptions(false);
    navigation.navigate("AddFromGallery", { collectionId: collection.id });
  };

  const addFromCameraRoll = async () => {
    setShowAddOptions(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const collectionsData = await AsyncStorage.getItem(
          STORAGE_KEYS.COLLECTIONS
        );
        const collections = collectionsData ? JSON.parse(collectionsData) : [];

        const collectionIndex = collections.findIndex(
          (c) => c.id === collection.id
        );
        if (collectionIndex === -1) return;

        const newPhotos = result.assets.map((asset) => ({
          id: Date.now().toString() + Math.random().toString(),
          uri: asset.uri,
          type: "image",
          tags: [],
        }));

        collections[collectionIndex].photos = [
          ...collections[collectionIndex].photos,
          ...newPhotos,
        ];

        await AsyncStorage.setItem(
          STORAGE_KEYS.COLLECTIONS,
          JSON.stringify(collections)
        );

        Alert.alert(
          "Success",
          `${newPhotos.length} photo(s) added to collection!`
        );
        navigation.replace("CollectionDetail", {
          collection: collections[collectionIndex],
        });
      } catch (error) {
        console.error("Error adding photos:", error);
        Alert.alert("Error", "Failed to add photos to collection.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
        <Header
          left={
            selectionMode ? (
              <TouchableOpacity onPress={cancelSelection}>
                <Text style={styles.cancelSelectionText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
              </TouchableOpacity>
            )
          }
          center={
            selectionMode ? (
              <Text style={styles.selectionCountText}>
                {selectedPhotos.length} selected
              </Text>
            ) : null
          }
          right={
            selectionMode ? (
              <TouchableOpacity onPress={deleteSelectedPhotos}>
                <Ionicons name="trash-outline" size={24} color="#DC2626" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={24} color="#3C3C3C" />
              </TouchableOpacity>
            )
          }
        />      

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
                  selectedCategory === tag && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(tag)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === tag && styles.categoryPillTextActive,
                  ]}
                >
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
              const isSelected = selectedPhotos.some((p) => p.id === photo.id);
              return (
                <TouchableOpacity
                  key={photo.id || index}
                  style={styles.collectionDetailPhotoItem}
                  onPress={() => handlePhotoPress(photo)}
                  onLongPress={() => handlePhotoLongPress(photo)}
                  delayLongPress={300}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.collectionDetailPhotoImage}
                  />
                  {selectionMode && (
                    <View
                      style={[
                        styles.photoSelectionCheckbox,
                        isSelected && styles.photoSelectionCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="white" />
                      )}
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
            <Text style={styles.emptyStateTitle}>
              No photos in this category
            </Text>
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
            {selectedPhotos.length} photo
            {selectedPhotos.length !== 1 ? "s" : ""} selected
          </Text>
          <TouchableOpacity
            style={styles.deleteBarButton}
            onPress={deleteSelectedPhotos}
          >
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

            <TouchableOpacity
              style={styles.addOptionItem}
              onPress={addFromGallery}
            >
              <View style={styles.addOptionIcon}>
                <Ionicons name="image-outline" size={24} color="#7D8F69" />
              </View>
              <View style={styles.addOptionText}>
                <Text style={styles.addOptionTitle}>From App Gallery</Text>
                <Text style={styles.addOptionSubtitle}>
                  Choose from your tagged photos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addOptionItem}
              onPress={addFromCameraRoll}
            >
              <View style={styles.addOptionIcon}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color="#7D8F69"
                />
              </View>
              <View style={styles.addOptionText}>
                <Text style={styles.addOptionTitle}>From Camera Roll</Text>
                <Text style={styles.addOptionSubtitle}>
                  Import from your device
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default CollectionDetailScreen;

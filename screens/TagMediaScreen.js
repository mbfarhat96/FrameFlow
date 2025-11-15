import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';  
import styles from '../styles/globalStyles';

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
      <Header
        left={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
          </TouchableOpacity>
        }
        center={
          <Text style={styles.headerTitle}>Tag Photos</Text>
        }
        right={
          <View style={{ width: 24 }} />
        }
      />

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

export default TagMediaScreen;
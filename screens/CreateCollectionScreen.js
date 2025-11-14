import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';

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

export default CreateCollectionScreen;

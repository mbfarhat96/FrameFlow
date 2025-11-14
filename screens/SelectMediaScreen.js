import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';

function SelectMediaScreen({ navigation }) {
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll access to import LA media.');
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

export default SelectMediaScreen;
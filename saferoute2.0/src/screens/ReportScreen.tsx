import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { MapHeader, InputField, Button } from '../components';
import { useReports, useLocation } from '../hooks';
import { colors, fontSizes, spacing, borderRadius, MAP_DEFAULT_DELTA } from '../config';
import { RootStackParamList, ReportCategory, REPORT_CATEGORY_CONFIG, Coordinates } from '../types';

type ReportScreenRouteProp = RouteProp<RootStackParamList, 'Report'>;
type ReportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Report'>;

const categories: { id: ReportCategory; label: string; icon: string }[] = [
  { id: 'dark_spot', label: 'Dark Spot', icon: 'flashlight-off' },
  { id: 'stray_dog', label: 'Stray Dog', icon: 'paw' },
  { id: 'harassment', label: 'Harassment', icon: 'alert-circle' },
  { id: 'light_failure', label: 'Light Failure', icon: 'lightbulb-outline' },
  { id: 'suspicious_activity', label: 'Suspicious', icon: 'eye-off' },
];

export const ReportScreen: React.FC = () => {
  const navigation = useNavigation<ReportScreenNavigationProp>();
  const route = useRoute<ReportScreenRouteProp>();
  const { currentLocation, getCurrentLocation } = useLocation();
  const { createReport } = useReports();

  const initialLocation = route.params?.location;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(initialLocation || null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Pick image from camera or gallery
  const pickImage = useCallback(async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to continue.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  // Use current location
  const useCurrentLocation = useCallback(async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    }
  }, [getCurrentLocation]);

  // Handle map location selection
  const handleMapPress = useCallback((event: { nativeEvent: { coordinate: Coordinates } }) => {
    setLocation(event.nativeEvent.coordinate);
    setShowMap(false);
  }, []);

  // Submit report
  const handleSubmit = useCallback(async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Please set a location');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReport({
        title: title.trim(),
        description: description.trim(),
        category,
        location,
        imageUri: imageUri || undefined,
      });

      Alert.alert('Success', 'Report submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Saved Offline',
        'Your report has been saved and will be submitted when you have an internet connection.'
      );
      navigation.goBack();
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, category, location, imageUri, createReport, navigation]);

  // Show image picker options
  const showImageOptions = useCallback(() => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [pickImage]);

  if (showMap) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <MapHeader
          showBackButton
          onBackPress={() => setShowMap(false)}
          title="Select Location"
        />
        <MapView
          style={styles.fullMap}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location?.latitude || currentLocation?.latitude || 37.7749,
            longitude: location?.longitude || currentLocation?.longitude || -122.4194,
            ...MAP_DEFAULT_DELTA,
          }}
          onPress={handleMapPress}
        >
          {location && (
            <Marker coordinate={location} />
          )}
        </MapView>
        <View style={styles.mapHint}>
          <Text style={styles.mapHintText}>Tap on the map to set location</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title="Report Issue"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Selection */}
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={24}
                  color={category === cat.id ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <InputField
            label="Title"
            placeholder="Brief title for the issue"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Description */}
          <InputField
            label="Description"
            placeholder="Describe what you observed..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            style={styles.textArea}
          />

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationContainer}>
            <Button
              title="Use Current Location"
              variant="outline"
              onPress={useCurrentLocation}
              icon={
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={18}
                  color={colors.primary}
                />
              }
              style={styles.locationButton}
            />
            <Button
              title="Select on Map"
              variant="outline"
              onPress={() => setShowMap(true)}
              icon={
                <MaterialCommunityIcons
                  name="map-marker"
                  size={18}
                  color={colors.primary}
                />
              }
              style={styles.locationButton}
            />
          </View>
          {location && (
            <Text style={styles.locationText}>
              📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
          )}

          {/* Photo */}
          <Text style={styles.sectionTitle}>Photo (Optional)</Text>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={24}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={showImageOptions}
            >
              <MaterialCommunityIcons
                name="camera-plus"
                size={32}
                color={colors.textMuted}
              />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <Button
            title="Submit Report"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  categoryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  categoryLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationButton: {
    flex: 1,
  },
  locationText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  addPhotoButton: {
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  fullMap: {
    flex: 1,
  },
  mapHint: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  mapHintText: {
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
});

export default ReportScreen;

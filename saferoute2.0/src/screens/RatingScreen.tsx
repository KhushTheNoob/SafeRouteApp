import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { MapHeader, Button, RatingStars, InputField } from '../components';
import { colors, fontSizes, spacing, borderRadius, shadows, mapDarkStyle } from '../config';
import { RootStackParamList, CreateRatingInput, Coordinates } from '../types';
import { submitRating } from '../services/ratingService';
import { useLocation } from '../hooks';

const { width } = Dimensions.get('window');

type RatingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;
type RatingScreenRouteProp = RouteProp<RootStackParamList, 'Main'>;

interface RatingCategory {
  key: keyof Pick<CreateRatingInput, 'lightingRating' | 'crowdRating' | 'safetyFeelingRating'>;
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const RATING_CATEGORIES: RatingCategory[] = [
  {
    key: 'lightingRating',
    label: 'Lighting',
    description: 'How well-lit is this area at night?',
    icon: 'lightbulb-on',
    color: colors.warning,
  },
  {
    key: 'crowdRating',
    label: 'Crowd Presence',
    description: 'How populated is this area during night hours?',
    icon: 'account-group',
    color: colors.info,
  },
  {
    key: 'safetyFeelingRating',
    label: 'Safety Feeling',
    description: 'How safe do you feel walking here at night?',
    icon: 'shield-check',
    color: colors.success,
  },
];

export const RatingScreen: React.FC = () => {
  const navigation = useNavigation<RatingScreenNavigationProp>();
  const route = useRoute<RatingScreenRouteProp>();
  const { location } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [streetName, setStreetName] = useState('');
  const [ratings, setRatings] = useState({
    lightingRating: 0,
    crowdRating: 0,
    safetyFeelingRating: 0,
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Use current location by default
  const handleUseCurrentLocation = useCallback(() => {
    if (location) {
      setSelectedLocation(location);
      setShowLocationPicker(false);
    } else {
      Alert.alert('Error', 'Unable to get your current location');
    }
  }, [location]);

  // Handle map press for location selection
  const handleMapPress = useCallback((event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  }, []);

  // Update rating for a category
  const handleRatingChange = useCallback(
    (key: keyof typeof ratings, value: number) => {
      setRatings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Calculate overall rating
  const overallRating = 
    (ratings.lightingRating + ratings.crowdRating + ratings.safetyFeelingRating) / 3;

  // Validate form
  const isFormValid =
    selectedLocation !== null &&
    ratings.lightingRating > 0 &&
    ratings.crowdRating > 0 &&
    ratings.safetyFeelingRating > 0;

  // Submit rating
  const handleSubmit = useCallback(async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    if (!isFormValid) {
      Alert.alert('Error', 'Please complete all ratings');
      return;
    }

    setIsSubmitting(true);
    try {
      const ratingInput: CreateRatingInput = {
        streetName: streetName || 'Unnamed Street',
        location: selectedLocation,
        lightingRating: ratings.lightingRating,
        crowdRating: ratings.crowdRating,
        safetyFeelingRating: ratings.safetyFeelingRating,
        notes: notes || undefined,
        timeOfDay: 'night',
      };

      await submitRating(ratingInput);
      
      Alert.alert(
        'Thank You!',
        'Your rating helps make routes safer for everyone.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLocation, isFormValid, streetName, ratings, notes, navigation]);

  // Get rating label
  const getRatingLabel = (rating: number): string => {
    if (rating === 0) return 'Not rated';
    if (rating <= 1) return 'Very Poor';
    if (rating <= 2) return 'Poor';
    if (rating <= 3) return 'Average';
    if (rating <= 4) return 'Good';
    return 'Excellent';
  };

  // Get rating color
  const getRatingColor = (rating: number): string => {
    if (rating === 0) return colors.textMuted;
    if (rating <= 2) return colors.danger;
    if (rating <= 3) return colors.warning;
    return colors.success;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapHeader
        title="Rate This Area"
        onMenuPress={() => {}}
        onProfilePress={() => {}}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          {showLocationPicker ? (
            <View style={styles.locationPicker}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                customMapStyle={mapDarkStyle}
                showsUserLocation
                initialRegion={
                  location
                    ? {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }
                    : undefined
                }
                onPress={handleMapPress}
              >
                {selectedLocation && (
                  <Marker coordinate={selectedLocation}>
                    <View style={styles.marker}>
                      <MaterialCommunityIcons
                        name="star-circle"
                        size={32}
                        color={colors.primary}
                      />
                    </View>
                  </Marker>
                )}
              </MapView>
              
              <View style={styles.locationButtons}>
                <Button
                  title="Use Current Location"
                  variant="outline"
                  onPress={handleUseCurrentLocation}
                  style={styles.locationButton}
                />
                <Button
                  title="Confirm Location"
                  onPress={() => setShowLocationPicker(false)}
                  disabled={!selectedLocation}
                  style={styles.locationButton}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.locationField}
              onPress={() => setShowLocationPicker(true)}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={selectedLocation ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.locationFieldText,
                  selectedLocation && styles.locationFieldTextActive,
                ]}
              >
                {selectedLocation
                  ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                  : 'Tap to select location on map'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}

          <InputField
            label="Street Name (Optional)"
            placeholder="e.g., Main Street, Park Avenue"
            value={streetName}
            onChangeText={setStreetName}
          />
        </View>

        {/* Rating Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate This Area</Text>

          {RATING_CATEGORIES.map((category) => (
            <View key={category.key} style={styles.ratingCategory}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIcon}>
                  <MaterialCommunityIcons
                    name={category.icon}
                    size={24}
                    color={category.color}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                </View>
              </View>
              
              <RatingStars
                rating={ratings[category.key]}
                onRatingChange={(value) => handleRatingChange(category.key, value)}
                size={32}
              />
              
              <Text
                style={[
                  styles.ratingLabel,
                  { color: getRatingColor(ratings[category.key]) },
                ]}
              >
                {getRatingLabel(ratings[category.key])}
              </Text>
            </View>
          ))}
        </View>

        {/* Overall Score */}
        <View style={styles.overallSection}>
          <Text style={styles.overallLabel}>Overall Safety Score</Text>
          <View style={styles.overallScoreContainer}>
            <Text
              style={[
                styles.overallScore,
                { color: getRatingColor(overallRating) },
              ]}
            >
              {overallRating > 0 ? overallRating.toFixed(1) : '--'}
            </Text>
            <Text style={styles.overallMax}>/5</Text>
          </View>
          <RatingStars rating={overallRating} size={20} editable={false} />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <InputField
            label="Additional Notes (Optional)"
            placeholder="Any specific observations about this area..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="Submit Rating"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isFormValid}
          />
          <Text style={styles.disclaimer}>
            Your rating will help other users find safer routes at night
          </Text>
        </View>
      </ScrollView>
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
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  locationPicker: {
    marginBottom: spacing.md,
  },
  map: {
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationButton: {
    flex: 1,
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  locationFieldText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  locationFieldTextActive: {
    color: colors.textPrimary,
  },
  ratingCategory: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  categoryLabel: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  overallSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overallLabel: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  overallScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: '700',
  },
  overallMax: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
  },
  submitSection: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  disclaimer: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default RatingScreen;

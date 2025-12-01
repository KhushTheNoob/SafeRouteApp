import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Report, ReportCategory, REPORT_CATEGORY_CONFIG } from '../types';
import { colors } from '../config/theme';

interface MapMarkersProps {
  reports: Report[];
  onMarkerPress?: (report: Report) => void;
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  reports,
  onMarkerPress,
}) => {
  const getMarkerIcon = (category: ReportCategory): string => {
    const config = REPORT_CATEGORY_CONFIG[category];
    return config?.icon || 'alert-circle';
  };

  const getMarkerColor = (category: ReportCategory): string => {
    const config = REPORT_CATEGORY_CONFIG[category];
    return config?.color || colors.warning;
  };

  return (
    <>
      {reports.map((report) => (
        <Marker
          key={report.id}
          coordinate={{
            latitude: report.location.latitude,
            longitude: report.location.longitude,
          }}
          onPress={() => onMarkerPress?.(report)}
          tracksViewChanges={false}
        >
          <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(report.category) }]}>
            <MaterialCommunityIcons
              name={getMarkerIcon(report.category) as any}
              size={16}
              color={colors.textPrimary}
            />
          </View>
          <View style={styles.markerTail} />
        </Marker>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  markerTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.textPrimary,
    alignSelf: 'center',
    marginTop: -2,
  },
});

export default MapMarkers;

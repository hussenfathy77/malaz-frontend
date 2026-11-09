import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Modal, ScrollView, Platform, Dimensions
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { doctorService } from '../../services/doctorService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_RADIUS_KM = 50;

export const NearbyDoctorsScreen = ({ onBack, onBookDoctor }) => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

  const fetchNearbyDoctors = useCallback(async (lat, lng, km) => {
    try {
      const data = await doctorService.getNearbyDoctors(lat, lng, km);
      setNearbyDoctors(data || []);
    } catch (e) {
      console.warn('Failed to fetch nearby doctors:', e.message);
      setNearbyDoctors([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLocationError(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied. Please enable it in Settings to find nearby doctors.');
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(coords);
        await fetchNearbyDoctors(coords.latitude, coords.longitude, radiusKm);
      } catch (e) {
        setLocationError('Could not determine your location. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChangeRadius = async (newKm) => {
    setRadiusKm(newKm);
    if (userLocation) {
      setLoading(true);
      await fetchNearbyDoctors(userLocation.latitude, userLocation.longitude, newKm);
      setLoading(false);
    }
  };

  const handleMarkerPress = (doctor) => {
    setSelectedDoctor(doctor);
    setDetailVisible(true);
  };

  const handleCenterOnMe = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        600
      );
    }
  };

  const getInitialRegion = () => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }
    // Default: Cairo, Egypt
    return {
      latitude: 30.0444,
      longitude: 31.2357,
      latitudeDelta: 1.0,
      longitudeDelta: 1.0,
    };
  };

  const formatDistance = (km) => {
    if (km == null) return '';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const radiusOptions = [10, 25, 50, 100];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {userLocation ? 'Finding nearby doctors...' : 'Getting your location...'}
        </Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="location-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>{locationError}</Text>
        <Button
          title="Go Back"
          variant="outline"
          onPress={onBack}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Nearby Doctors</Text>
          <Text style={styles.headerSub}>
            {nearbyDoctors.length} doctor{nearbyDoctors.length !== 1 ? 's' : ''} within {radiusKm} km
          </Text>
        </View>
        <TouchableOpacity
          style={styles.centerBtn}
          onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        >
          <Ionicons
            name={viewMode === 'map' ? 'list-outline' : 'map-outline'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
        {viewMode === 'map' && (
          <TouchableOpacity style={styles.centerBtn} onPress={handleCenterOnMe}>
            <Ionicons name="locate-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Radius Filter */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Radius:</Text>
        {radiusOptions.map((km) => (
          <TouchableOpacity
            key={km}
            style={[styles.radiusChip, radiusKm === km && styles.radiusChipActive]}
            onPress={() => handleChangeRadius(km)}
          >
            <Text style={[styles.radiusChipText, radiusKm === km && styles.radiusChipTextActive]}>
              {km} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* View Content: Map View or List View */}
      {viewMode === 'map' ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={getInitialRegion()}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass
          >
            {/* Search radius circle */}
            {userLocation && (
              <Circle
                center={userLocation}
                radius={radiusKm * 1000}
                strokeColor={colors.primary + '55'}
                fillColor={colors.primary + '10'}
                strokeWidth={1.5}
              />
            )}

            {/* Doctor markers */}
            {nearbyDoctors.map((doc) => {
              const lat = doc.latitude ?? doc.doctor?.latitude;
              const lng = doc.longitude ?? doc.doctor?.longitude;
              if (!lat || !lng) return null;
              return (
                <Marker
                  key={doc.id}
                  coordinate={{ latitude: parseFloat(lat), longitude: parseFloat(lng) }}
                  title={doc.user?.full_name || doc.full_name || 'Doctor'}
                  description={doc.specialization || ''}
                  onPress={() => handleMarkerPress(doc)}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.markerBubble}>
                      <Ionicons name="medical" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.markerTail} />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {/* Bottom Doctor List */}
          {nearbyDoctors.length > 0 && (
            <View style={styles.listContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                {nearbyDoctors.map((doc) => {
                  const name = doc.user?.full_name || doc.full_name || 'Doctor';
                  const spec = doc.specialization || 'Specialist';
                  const dist = formatDistance(doc.distance_km);
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={styles.doctorCard}
                      onPress={() => handleMarkerPress(doc)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.doctorAvatar}>
                        <Ionicons name="person" size={22} color={colors.primary} />
                      </View>
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName} numberOfLines={1}>{name}</Text>
                        <Text style={styles.doctorSpec} numberOfLines={1}>{spec}</Text>
                        {dist ? (
                          <View style={styles.distanceRow}>
                            <Ionicons name="navigate-outline" size={11} color={colors.primary} />
                            <Text style={styles.distanceText}>{dist} away</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </>
      ) : (
        /* Full List View */
        <ScrollView style={styles.verticalList} contentContainerStyle={styles.verticalListContent}>
          {nearbyDoctors.length === 0 ? (
            <View style={styles.noResultsBox}>
              <Ionicons name="search-outline" size={32} color={colors.textMuted} />
              <Text style={styles.noResultsText}>No doctors found within {radiusKm} km.</Text>
            </View>
          ) : (
            nearbyDoctors.map((doc) => {
              const name = doc.user?.full_name || doc.full_name || 'Doctor';
              const spec = doc.specialization || 'Specialist';
              const dist = formatDistance(doc.distance_km);
              return (
                <Card key={doc.id} style={styles.verticalCard}>
                  <View style={styles.verticalCardTop}>
                    <View style={styles.doctorAvatarLarge}>
                      <Ionicons name="person" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verticalName}>Dr. {name}</Text>
                      <Text style={styles.verticalSpec}>{spec}</Text>
                      {dist ? (
                        <View style={styles.distanceRow}>
                          <Ionicons name="navigate-outline" size={12} color={colors.primary} />
                          <Text style={styles.distanceText}>{dist} away from you</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {doc.address && (
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.addressText}>{doc.address}</Text>
                    </View>
                  )}

                  <View style={styles.verticalCardFooter}>
                    <Text style={styles.priceTag}>
                      {doc.session_price != null ? `${doc.session_price} EGP / session` : 'Consultation'}
                    </Text>
                    <Button
                      title="Book In-Person"
                      size="sm"
                      onPress={() => {
                        setSelectedDoctor(doc);
                        setDetailVisible(true);
                      }}
                    />
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {nearbyDoctors.length === 0 && !loading && viewMode === 'map' && (
        <View style={styles.noResultsBanner}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={styles.noResultsText}>
            No doctors found within {radiusKm} km. Try expanding the radius.
          </Text>
        </View>
      )}

      {/* Doctor Detail Modal */}
      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalAvatar}>
                <Ionicons name="person" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName}>
                  Dr. {selectedDoctor?.user?.full_name || selectedDoctor?.full_name || '—'}
                </Text>
                <Text style={styles.modalSpec}>{selectedDoctor?.specialization || 'Specialist'}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="navigate-outline" size={15} color={colors.primary} />
              <Text style={styles.modalInfoText}>
                {selectedDoctor?.distance_km != null
                  ? `${formatDistance(selectedDoctor.distance_km)} from your location`
                  : 'Distance unavailable'}
              </Text>
            </View>

            {selectedDoctor?.address && (
              <View style={styles.modalInfoRow}>
                <Ionicons name="location-outline" size={15} color={colors.primary} />
                <Text style={styles.modalInfoText}>{selectedDoctor.address}</Text>
              </View>
            )}

            {selectedDoctor?.session_price != null && (
              <View style={styles.modalInfoRow}>
                <Ionicons name="cash-outline" size={15} color={colors.primary} />
                <Text style={styles.modalInfoText}>
                  Session fee: {selectedDoctor.session_price} EGP
                </Text>
              </View>
            )}

            <View style={styles.modalBadgeRow}>
              <Badge customLabel="In-Person Available" status="CONFIRMED" />
              {selectedDoctor?.years_of_experience && (
                <Badge
                  customLabel={`${selectedDoctor.years_of_experience} yrs exp`}
                  status="VERIFIED"
                />
              )}
            </View>

            <Button
              title="Book In-Person Appointment"
              icon={<Ionicons name="calendar-outline" size={17} color="#FFFFFF" />}
              size="lg"
              style={{ marginTop: 14 }}
              onPress={() => {
                setDetailVisible(false);
                if (onBookDoctor) onBookDoctor(selectedDoctor);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  centerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 4,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radiusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -1,
  },
  listContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
    width: SCREEN_WIDTH * 0.56,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  doctorSpec: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  noResultsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 14,
  },
  noResultsText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  modalSpec: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  verticalList: {
    flex: 1,
  },
  verticalListContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  verticalCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verticalCardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  verticalSpec: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
    marginBottom: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
    marginTop: 4,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  verticalCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
    marginTop: 4,
  },
  priceTag: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});

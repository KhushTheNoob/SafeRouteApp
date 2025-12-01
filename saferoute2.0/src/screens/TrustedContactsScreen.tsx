import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MapHeader, InputField, Button } from '../components';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../config';
import { RootStackParamList, TrustedContact, CreateContactInput } from '../types';
import {
  getTrustedContacts,
  createTrustedContact,
  deleteContact,
  updateContact,
  sendContactInvitation,
} from '../services/contactService';

type ContactsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const TrustedContactsScreen: React.FC = () => {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState<CreateContactInput>({
    name: '',
    phoneNumber: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load contacts
  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTrustedContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Add new contact
  const handleAddContact = useCallback(async () => {
    if (!newContact.name.trim() || !newContact.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter name and phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const contact = await createTrustedContact(newContact);
      setContacts((prev) => [contact, ...prev]);
      setNewContact({ name: '', phoneNumber: '', email: '' });
      setShowAddForm(false);

      // Offer to send invitation
      Alert.alert(
        'Contact Added',
        'Would you like to send an invitation link to this contact?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Send Invitation',
            onPress: () => handleSendInvitation(contact.id),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  }, [newContact]);

  // Delete contact
  const handleDeleteContact = useCallback((contact: TrustedContact) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contact.id);
              setContacts((prev) => prev.filter((c) => c.id !== contact.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove contact');
            }
          },
        },
      ]
    );
  }, []);

  // Toggle tracking permission
  const handleToggleTracking = useCallback(async (contact: TrustedContact) => {
    try {
      await updateContact(contact.id, { canTrack: !contact.canTrack });
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contact.id ? { ...c, canTrack: !c.canTrack } : c
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact');
    }
  }, []);

  // Send invitation
  const handleSendInvitation = useCallback(async (contactId: string) => {
    try {
      const invitation = await sendContactInvitation(contactId);

      const shareMessage = `Join me on SafeRoute! Use this link to connect as my trusted contact: saferoute://invite/${invitation.token}`;

      await Share.share({
        message: shareMessage,
        title: 'SafeRoute Invitation',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    }
  }, []);

  // Render contact item
  const renderContact = useCallback(
    ({ item }: { item: TrustedContact }) => (
      <View style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name="account"
              size={24}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
            <View style={styles.statusRow}>
              {item.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={14}
                    color={colors.success}
                  />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color={colors.warning}
                  />
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.contactActions}>
          {/* Tracking toggle */}
          <TouchableOpacity
            style={[
              styles.trackingToggle,
              item.canTrack && styles.trackingToggleActive,
            ]}
            onPress={() => handleToggleTracking(item)}
          >
            <MaterialCommunityIcons
              name={item.canTrack ? 'eye' : 'eye-off'}
              size={20}
              color={item.canTrack ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          {/* Resend invitation */}
          {!item.isVerified && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSendInvitation(item.id)}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={colors.secondary}
              />
            </TouchableOpacity>
          )}

          {/* Delete */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteContact(item)}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={20}
              color={colors.danger}
            />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleToggleTracking, handleSendInvitation, handleDeleteContact]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapHeader
        title="Trusted Contacts"
        onMenuPress={() => {}}
        onProfilePress={() => {}}
      />

      <View style={styles.content}>
        {/* Add contact form */}
        {showAddForm ? (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add Trusted Contact</Text>
            <InputField
              label="Name"
              placeholder="Contact name"
              value={newContact.name}
              onChangeText={(text) =>
                setNewContact((prev) => ({ ...prev, name: text }))
              }
            />
            <InputField
              label="Phone Number"
              placeholder="+1 234 567 8900"
              value={newContact.phoneNumber}
              onChangeText={(text) =>
                setNewContact((prev) => ({ ...prev, phoneNumber: text }))
              }
              keyboardType="phone-pad"
            />
            <InputField
              label="Email (Optional)"
              placeholder="email@example.com"
              value={newContact.email}
              onChangeText={(text) =>
                setNewContact((prev) => ({ ...prev, email: text }))
              }
              keyboardType="email-address"
            />
            <View style={styles.formButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowAddForm(false);
                  setNewContact({ name: '', phoneNumber: '', email: '' });
                }}
                style={styles.formButton}
              />
              <Button
                title="Add Contact"
                onPress={handleAddContact}
                loading={isSubmitting}
                style={styles.formButton}
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.addButtonText}>Add Trusted Contact</Text>
          </TouchableOpacity>
        )}

        {/* Contacts list */}
        <Text style={styles.sectionTitle}>
          Your Contacts ({contacts.length})
        </Text>

        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No Trusted Contacts</Text>
              <Text style={styles.emptyText}>
                Add contacts who will be notified during SOS and can track you in Walk With Me
              </Text>
            </View>
          }
        />
      </View>
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
    padding: spacing.lg,
  },
  addForm: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  formButton: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  listContent: {
    gap: spacing.md,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.small,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  contactName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contactPhone: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: fontSizes.xs,
    color: colors.success,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingText: {
    fontSize: fontSizes.xs,
    color: colors.warning,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackingToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingToggleActive: {
    backgroundColor: colors.primaryLight + '30',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default TrustedContactsScreen;

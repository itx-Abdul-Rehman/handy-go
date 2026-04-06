/**
 * SOS API — Emergency alert management for admin panel.
 */
import { Query } from 'appwrite';
import { account, databases, functions } from '../appwrite-client';
import { appwriteConfig } from '../appwrite-config';

const { databaseId, collections, functions: fnIds } = appwriteConfig;

export const sosApi = {
  getActiveSOS: async () => {
    const result = await databases.listDocuments(
      databaseId,
      collections.sosAlerts,
      [
        Query.notEqual('status', 'RESOLVED'),
        Query.orderDesc('priority'),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    );

    return {
      success: true,
      alerts: result.documents.map((doc) => ({
        _id: doc.$id,
        booking: doc.bookingNumber
          ? { bookingNumber: doc.bookingNumber, serviceCategory: doc.serviceCategory ?? '' }
          : undefined,
        initiatedBy: {
          userType: doc.initiatedByType,
          userId: doc.initiatedByUserId,
          name: doc.initiatedByName ?? 'Unknown',
          phone: doc.initiatedByPhone ?? '',
        },
        priority: doc.priority,
        aiAssessedPriority: doc.aiAssessedPriority,
        reason: doc.reason,
        description: doc.description,
        location: {
          coordinates: doc.latitude != null
            ? [doc.longitude, doc.latitude] as [number, number]
            : [0, 0] as [number, number],
          address: doc.address ?? '',
        },
        evidence: {
          images: doc.evidenceImages ? JSON.parse(doc.evidenceImages) : [],
          audioRecording: doc.audioRecording,
        },
        status: doc.status,
        assignedAdmin: doc.assignedAdminId,
        resolution: doc.resolutionAction
          ? {
              action: doc.resolutionAction,
              resolvedBy: doc.resolvedById,
              resolvedAt: doc.resolvedAt,
              notes: doc.resolutionNotes,
            }
          : null,
        createdAt: doc.$createdAt,
      })),
    };
  },

  assignSOS: async (sosId: string) => {
    const user = await account.get();
    await databases.updateDocument(
      databaseId,
      collections.sosAlerts,
      sosId,
      { assignedAdminId: user.$id },
    );
    return { success: true };
  },

  resolveSOS: async (sosId: string, data: { action: string; notes: string }) => {
    const currentUser = await account.get();
    await functions.createExecution(
      fnIds.sosAnalyzer,
      JSON.stringify({
        action: 'resolve',
        sosId,
        resolutionAction: data.action,
        resolvedBy: currentUser.$id,
        notes: data.notes,
      }),
    );
    return { success: true };
  },

  escalateSOS: async (sosId: string, data: { reason: string }) => {
    const currentUser = await account.get();
    await functions.createExecution(
      fnIds.sosAnalyzer,
      JSON.stringify({
        action: 'escalate',
        sosId,
        reason: data.reason,
        escalatedBy: currentUser.$id,
      }),
    );
    return { success: true };
  },
};

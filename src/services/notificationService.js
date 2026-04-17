// TEMPLATE — service layer pattern for cross-entity orchestration.
//
// WHY THIS FILE EXISTS
// --------------------
// Controllers should stay thin — translate HTTP ↔ domain, no business logic.
// Repositories should stay thin — single touchpoint for ONE collection, no
// business logic, no cross-entity work.
//
// When an operation touches multiple entities or has meaningful business
// rules, it belongs in a service. Notification creation is the canonical
// example:
//
//   controller → notificationService.createFromDevicePress(input)
//                    ├─ deviceRepository.findById(deviceId)    — load Device
//                    ├─ derive userId + caregiverId from Device
//                    ├─ notificationRepository.create({...})   — insert pending
//                    ├─ push (FCM/alternative)                 — side effect
//                    └─ notificationRepository.update(id, { status, sentAt })
//
// Pure CRUD for User/Caregiver/Device does NOT need a service — the
// controller calls the repository directly (see userController.js).
//
// HOW TO EXTEND
// -------------
// For each cross-entity flow, add a named export that:
//   1. Loads any entities it needs via repositories.
//   2. Validates invariants (throw AppError on failure).
//   3. Mutates state via repositories.
//   4. Calls side effects (push, email).
//   5. Returns the output shape.
//
// Keep services free of Express objects (req/res) — they take and return
// plain data. That keeps them unit-testable without HTTP machinery.

/**
 * createFromDevicePress — called by POST /notifications.
 *
 * @param {{ deviceId: string, type: 'standard'|'urgent' }} input
 * @returns {Promise<object>} created notification
 *
 * Invariants to enforce when implementing:
 *   - Device exists and is active.
 *   - Referenced Caregiver exists and is active.
 *   - Notification.userId + Notification.caregiverId are copied from Device
 *     at the moment of create (historical snapshot).
 */
export async function createFromDevicePress(_input) {
  // TODO: implement per the flow above.
  //   const device = await deviceRepository.findById(input.deviceId);
  //   if (!device || !device.isActive) throw new NotFoundError('Device', input.deviceId);
  //   const notification = await notificationRepository.create({
  //     deviceId: device.id,
  //     userId: device.userId,
  //     caregiverId: device.caregiverId,
  //     type: input.type,
  //     status: 'pending',
  //   });
  //   try {
  //     await pushAdapter.send({ ... });
  //     return notificationRepository.update(notification.id, {
  //       status: 'sent',
  //       sentAt: new Date(),
  //     });
  //   } catch (err) {
  //     await notificationRepository.update(notification.id, { status: 'failed' });
  //     throw err;
  //   }
  throw new Error('notificationService.createFromDevicePress — not implemented');
}

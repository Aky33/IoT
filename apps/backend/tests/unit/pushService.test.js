import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock web-push before importing the service
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

// Mock Caregiver model
vi.mock('../../src/models/Caregiver.js', () => ({
  Caregiver: {
    findByIdAndUpdate: vi.fn(),
  },
}));

// Mock config
vi.mock('../../src/config/index.js', () => ({
  config: {
    vapid: {
      subject: 'mailto:test@test.com',
      publicKey: 'test-public-key',
      privateKey: 'test-private-key',
    },
  },
}));

const webpush = (await import('web-push')).default;
const { Caregiver } = await import('../../src/models/Caregiver.js');
const { sendPush } = await import('../../src/services/pushService.js');

describe('pushService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true on successful push', async () => {
    webpush.sendNotification.mockResolvedValue({});

    const result = await sendPush('caregiver-1', { endpoint: 'https://example.com' }, {
      id: 'n1', type: 'standard', deviceName: 'Tlačítko',
    });

    expect(result).toBe(true);
    expect(webpush.sendNotification).toHaveBeenCalledOnce();
  });

  it('returns false on push failure', async () => {
    webpush.sendNotification.mockRejectedValue(new Error('Network error'));

    const result = await sendPush('caregiver-1', { endpoint: 'https://example.com' }, {
      id: 'n1', type: 'urgent', deviceName: 'Test',
    });

    expect(result).toBe(false);
  });

  it('cleans subscription on 410 Gone', async () => {
    const err = new Error('Gone');
    err.statusCode = 410;
    webpush.sendNotification.mockRejectedValue(err);

    await sendPush('caregiver-1', { endpoint: 'https://example.com' }, {
      id: 'n1', type: 'standard', deviceName: 'Test',
    });

    expect(Caregiver.findByIdAndUpdate).toHaveBeenCalledWith(
      'caregiver-1',
      { $unset: { pushSubscription: 1 } },
    );
  });

  it('cleans subscription on 404', async () => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    webpush.sendNotification.mockRejectedValue(err);

    await sendPush('caregiver-1', { endpoint: 'https://example.com' }, {
      id: 'n1', type: 'standard', deviceName: 'Test',
    });

    expect(Caregiver.findByIdAndUpdate).toHaveBeenCalledWith(
      'caregiver-1',
      { $unset: { pushSubscription: 1 } },
    );
  });

  it('does not clean subscription on other errors', async () => {
    const err = new Error('Server Error');
    err.statusCode = 500;
    webpush.sendNotification.mockRejectedValue(err);

    await sendPush('caregiver-1', { endpoint: 'https://example.com' }, {
      id: 'n1', type: 'standard', deviceName: 'Test',
    });

    expect(Caregiver.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('sends correct payload for urgent notifications', async () => {
    webpush.sendNotification.mockResolvedValue({});

    await sendPush('caregiver-1', { endpoint: 'https://example.com' }, {
      id: 'n1', type: 'urgent', deviceName: 'Tlačítko obývák',
    });

    const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
    expect(payload.title).toBe('URGENTNÍ ALERT');
    expect(payload.body).toBe('Zařízení: Tlačítko obývák');
    expect(payload.type).toBe('urgent');
  });

  it('sends correct payload for standard notifications', async () => {
    webpush.sendNotification.mockResolvedValue({});

    await sendPush('caregiver-1', { endpoint: 'https://example.com' }, {
      id: 'n1', type: 'standard', deviceName: 'Tlačítko kuchyň',
    });

    const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
    expect(payload.title).toBe('Nová notifikace');
    expect(payload.body).toBe('Zařízení: Tlačítko kuchyň');
  });
});

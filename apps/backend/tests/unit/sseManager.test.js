import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribe, emit } from '../../src/services/sseManager.js';

function createMockRes() {
  const res = {
    writeHead: vi.fn(),
    write: vi.fn(),
    on: vi.fn(),
    flush: vi.fn(),
  };
  return res;
}

describe('sseManager', () => {
  it('sends SSE event to subscribed client', () => {
    const res = createMockRes();
    subscribe('caregiver-1', res);

    emit('caregiver-1', { id: 'n1', type: 'urgent' });

    const writeCall = res.write.mock.calls.find((c) => c[0].includes('"id":"n1"'));
    expect(writeCall).toBeDefined();
  });

  it('does not send to other caregivers', () => {
    const res1 = createMockRes();
    const res2 = createMockRes();
    subscribe('caregiver-1', res1);
    subscribe('caregiver-2', res2);

    emit('caregiver-1', { id: 'n1', type: 'standard' });

    expect(res1.write).toHaveBeenCalled();
    const res2DataCalls = res2.write.mock.calls.filter((c) => c[0].includes('"id"'));
    expect(res2DataCalls).toHaveLength(0);
  });

  it('cleans up on client disconnect', () => {
    const res = createMockRes();
    let closeCallback;
    res.on.mockImplementation((event, cb) => {
      if (event === 'close') closeCallback = cb;
    });

    subscribe('caregiver-1', res);
    closeCallback();

    emit('caregiver-1', { id: 'n2', type: 'standard' });
    const dataCalls = res.write.mock.calls.filter((c) => c[0].includes('"id":"n2"'));
    expect(dataCalls).toHaveLength(0);
  });
});

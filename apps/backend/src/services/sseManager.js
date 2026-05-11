import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function subscribe(caregiverId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const listener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  emitter.on(caregiverId, listener);

  res.on('close', () => {
    emitter.off(caregiverId, listener);
  });
}

export function emit(caregiverId, notification) {
  return emitter.emit(caregiverId, notification);
}

import { describe, it, expect } from 'vitest';
import { Schema } from 'mongoose';

import { cleanJson } from '../../src/utils/mongoosePlugins.js';

describe('cleanJson plugin', () => {
  it('configures toJSON to replace _id with id and drop __v', () => {
    const schema = new Schema({ name: String });
    schema.plugin(cleanJson);

    const opts = schema.get('toJSON');
    expect(opts.virtuals).toBe(true);
    expect(opts.versionKey).toBe(false);
    expect(typeof opts.transform).toBe('function');
  });

  it('transform converts _id to string id and deletes _id', () => {
    const schema = new Schema({ name: String });
    schema.plugin(cleanJson);

    const transform = schema.get('toJSON').transform;
    const fakeId = { toString: () => '507f1f77bcf86cd799439011' };
    const ret = { _id: fakeId, name: 'test', __v: 0 };

    const result = transform(null, ret);

    expect(result.id).toBe('507f1f77bcf86cd799439011');
    expect(result._id).toBeUndefined();
    expect(result.name).toBe('test');
  });
});

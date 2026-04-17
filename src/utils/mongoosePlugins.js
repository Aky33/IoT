// Shared Mongoose schema plugins.

/**
 * cleanJson — normalizes JSON serialization across all models.
 *
 * - Replaces `_id` with `id` (stringified).
 * - Drops Mongoose internal `__v`.
 * - Keeps virtuals enabled so computed fields (e.g., derived getters) appear.
 *
 * Apply to every schema:
 *   schema.plugin(cleanJson);
 *
 * Effect: res.json(doc) returns API-friendly shape without leaking
 * Mongoose internals. This is the 80/20 alternative to a full input/output
 * mapper — keep in mind it couples API shape to DB shape. For fields that
 * need divergence (e.g., derived `fullName`), add a virtual or override
 * `toJSON.transform` locally on that schema.
 */
export function cleanJson(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    },
  });
}

/** Serialise documents as { id, ... } without _id / __v / user / timestamps. */
export function cleanJson(schema) {
  schema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.user;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    },
  });
}

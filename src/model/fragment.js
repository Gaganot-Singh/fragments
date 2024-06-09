const { randomUUID } = require('crypto');
const contentType = require('content-type');

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId || !type) {
      throw new Error('ownerId and type are required');
    }

    if (typeof size !== 'number' || size < 0) {
      throw new Error('size must be a non-negative number');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;

    if (!Fragment.isSupportedType(this.type)) {
      throw new Error(`Unsupported type: ${this.type}`);
    }
  }

  static async byUser(ownerId, expand = false) {
    return listFragments(ownerId, expand);
  }

  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new Error('Fragment not found');
    }
    return new Fragment(fragment);
  }

  static async delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  async save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  async getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
    return [this.mimeType];
  }

  static isSupportedType(value) {
    const { type } = contentType.parse(value);
    return ['text/plain'].includes(type);
  }
}

module.exports.Fragment = Fragment;

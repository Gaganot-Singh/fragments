const { randomUUID } = require('crypto');
const contentType = require('content-type');
const sharp = require('sharp');
const yaml = require('js-yaml');
const markdownIt = require('markdown-it')();

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
    switch (this.mimeType) {
      case 'text/plain':
        return ['text/plain'];
      case 'text/markdown':
        return ['text/markdown', 'text/html', 'text/plain'];
      case 'text/html':
        return ['text/html', 'text/plain'];
      case 'text/csv':
        return ['text/csv', 'application/json', 'text/plain'];
      case 'application/json':
        return ['application/json', 'application/yaml', 'text/csv', 'text/plain'];
      case 'application/yaml':
        return ['application/yaml', 'application/json', 'text/plain'];
      case 'image/png':
        return ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
      case 'image/jpeg':
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
      case 'image/webp':
        return ['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/avif'];
      case 'image/gif':
        return ['image/gif', 'image/png', 'image/jpeg', 'image/webp', 'image/avif'];
      case 'image/avif':
        return ['image/avif', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
      default:
        return [this.mimeType];
    }
  }

  getMimeType(extension) {
    const mimeTypes = {
      txt: 'text/plain',
      html: 'text/html',
      md: 'text/markdown',
      csv: 'text/csv',
      json: 'application/json',
      yaml: 'application/yaml',
      yml: 'application/yaml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      avif: 'image/avif',
    };
    return mimeTypes[extension] || this.mimeType;
  }

  async convert(extension) {
    const data = await this.getData();

    switch (this.mimeType) {
      case 'text/markdown':
        return this.convertMarkdown(extension, data);
      case 'application/json':
        return this.convertJson(extension, data);
      case 'application/yaml':
        return this.convertYaml(extension, data);
      case 'text/html':
      case 'text/plain':
      case 'text/csv':
        return this.convertTextOrCsv(extension, data);
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/gif':
      case 'image/avif':
        return this.convertImage(extension, data);
      default:
        throw new Error('Unsupported conversion type');
    }
  }

  convertMarkdown(extension, data) {
    if (extension === 'html') {
      return {
        type: 'text/html',
        data: markdownIt.render(data.toString()),
      };
    } else if (extension === 'txt') {
      return {
        type: 'text/plain',
        data: data.toString(),
      };
    } else {
      throw new Error('Unsupported conversion for markdown');
    }
  }

  convertJson(extension, data) {
    const jsonData = JSON.parse(data.toString());
    if (extension === 'yaml' || extension === 'yml') {
      return {
        type: 'application/yaml',
        data: yaml.dump(jsonData),
      };
    } else if (extension === 'txt') {
      return {
        type: 'text/plain',
        data: JSON.stringify(jsonData, null, 2),
      };
    } else if (extension === 'csv') {
      const keys = Object.keys(jsonData[0]);
      const csvData = [
        keys.join(','), 
        ...jsonData.map(row => keys.map(key => row[key]).join(',')),
      ].join('\n');
      return {
        type: 'text/csv',
        data: csvData,
      };
    } else {
      throw new Error('Unsupported conversion for JSON');
    }
  }

  convertYaml(extension, data) {
    if (extension === 'json') {
      const yamlData = yaml.load(data.toString());
      return {
        type: 'application/json',
        data: JSON.stringify(yamlData, null, 2),
      };
    } else if (extension === 'txt') {
      return {
        type: 'text/plain',
        data: data.toString(),
      };
    } else {
      throw new Error('Unsupported conversion for YAML');
    }
  }

  convertTextOrCsv(extension, data) {
    if (this.mimeType === 'text/csv') {
      return this.convertCsvTo(extension, data);
    } else if (extension === 'txt') {
      return {
        type: 'text/plain',
        data: data.toString(),
      };
    } else {
      throw new Error('Unsupported conversion for text/csv');
    }
  }

  convertCsvTo(extension, data) {
    const csvData = data.toString();
    const [header, ...rows] = csvData.split('\n');
    const keys = header.split(',');
    const jsonData = rows.map(row => {
      const values = row.split(',');
      return keys.reduce((obj, key, i) => ({ ...obj, [key]: values[i] }), {});
    });

    if (extension === 'json') {
      return {
        type: 'application/json',
        data: JSON.stringify(jsonData, null, 2),
      };
    } else if (extension === 'txt') {
      return {
        type: 'text/plain',
        data: csvData,
      };
    } else {
      throw new Error('Unsupported conversion for CSV');
    }
  }

  async convertImage(extension, data) {
    const image = sharp(data);

    switch (extension) {
      case 'png':
        return { type: 'image/png', data: await image.png().toBuffer() };
      case 'jpg':
      case 'jpeg':
        return { type: 'image/jpeg', data: await image.jpeg().toBuffer() };
      case 'webp':
        return { type: 'image/webp', data: await image.webp().toBuffer() };
      case 'gif':
        return { type: 'image/gif', data: await image.gif().toBuffer() };
      case 'avif':
        return { type: 'image/avif', data: await image.avif().toBuffer() };
      default:
        throw new Error('Unsupported image conversion');
    }
  }

  static isSupportedType(value) {
    const { type } = contentType.parse(value);
    return [
      'text/plain',
      'text/plain; charset=utf-8',
      'text/markdown',
      'text/html',
      'text/csv',
      'application/json',
      'application/yaml',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif'
    ].includes(type);
  }
}

module.exports.Fragment = Fragment;

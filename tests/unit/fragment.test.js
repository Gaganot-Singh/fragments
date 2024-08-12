const { Fragment } = require('../../src/model/fragment');
const sharp = require('sharp');

// Wait for a certain number of ms. Feel free to change this value
// if it isn't long enough for your test runs. Returns a Promise.
const wait = async (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

const validTypes = [
  `text/plain`,
  `text/markdown`,
  `text/html`,
  `application/json`,
  `application/yaml`,
  `text/csv`,
  `image/png`,
  `image/jpeg`,
  `image/webp`,
  `image/gif`,
  `image/avif`,
];

describe('Fragment class', () => {
  test('common formats are supported', () => {
    validTypes.forEach((format) => expect(Fragment.isSupportedType(format)).toBe(true));
  });

  describe('Fragment()', () => {
    test('ownerId and type are required', () => {
      expect(() => new Fragment({})).toThrow();
    });

    test('ownerId is required', () => {
      expect(() => new Fragment({ type: 'text/plain', size: 1 })).toThrow();
    });

    test('type is required', () => {
      expect(() => new Fragment({ ownerId: '1234', size: 1 })).toThrow();
    });

    test('type can be a simple media type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
    });

    test('type can include a charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
    });

    test('size gets set to 0 if missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      expect(fragment.size).toBe(0);
    });

    test('size must be a number', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: '1' })).toThrow();
    });

    test('size can be 0', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })).not.toThrow();
    });

    test('size cannot be negative', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })).toThrow();
    });

    test('invalid types throw', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'application/msword', size: 1 })
      ).toThrow();
    });

    test('valid types can be set', () => {
      validTypes.forEach((format) => {
        const fragment = new Fragment({ ownerId: '1234', type: format, size: 1 });
        expect(fragment.type).toEqual(format);
      });
    });

    test('fragments have an id', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(fragment.id).toMatch(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      );
    });

    test('fragments use id passed in if present', () => {
      const fragment = new Fragment({
        id: 'id',
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(fragment.id).toEqual('id');
    });

    test('fragments get a created datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.created)).not.toBeNaN();
    });

    test('fragments get an updated datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.updated)).not.toBeNaN();
    });

    test('throws an error for unsupported MIME types', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'application/msword' })).toThrow(
        'Unsupported type: application/msword'
      );
    });

    test('throws an error if size is negative', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })).toThrow(
        'size must be a non-negative number'
      );
    });

    test('throws an error if size is not a number', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 'large' })).toThrow(
        'size must be a non-negative number'
      );
    });
  });

  describe('isSupportedType()', () => {
    test('common text types are supported, with and without charset', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true);
    });

    test('other types are not supported', () => {
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false);
      expect(Fragment.isSupportedType('application/msword')).toBe(false);
      expect(Fragment.isSupportedType('audio/webm')).toBe(false);
      expect(Fragment.isSupportedType('video/ogg')).toBe(false);
    });
  });

  describe('mimeType, isText', () => {
    test('mimeType returns the mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('mimeType returns the mime type if charset is missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('isText returns expected results', () => {
      // Text fragment
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.isText).toBe(true);
    });
  });

  describe('formats', () => {
    test('formats returns the expected result for plain text', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['text/plain']);
    });

    test('formats returns the expected result for JSON', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'application/json',
        size: 0,
      });
      expect(fragment.formats).toEqual([
        'application/json',
        'application/yaml',
        'text/csv',
        'text/plain',
      ]);
    });

    test('formats returns the expected result for PNG images', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/png',
        size: 0,
      });
      expect(fragment.formats).toEqual([
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif',
        'image/avif',
      ]);
    });
  });

  describe('save(), getData(), setData(), byId(), byUser(), delete()', () => {
    test('byUser() returns an empty array if there are no fragments for this user', async () => {
      expect(await Fragment.byUser('1234')).toEqual([]);
    });

    test('a fragment can be created and save() stores a fragment for the user', async () => {
      const data = Buffer.from('hello');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      const fragment2 = await Fragment.byId('1234', fragment.id);
      expect(fragment2).toEqual(fragment);
      expect(await fragment2.getData()).toEqual(data);
    });

    test('save() updates the updated date/time of a fragment', async () => {
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      const modified1 = fragment.updated;
      await wait();
      await fragment.save();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test('setData() updates the updated date/time of a fragment', async () => {
      const data = Buffer.from('hello');
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      const modified1 = fragment.updated;
      await wait();
      await fragment.setData(data);
      await wait();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test("a fragment is added to the list of a user's fragments", async () => {
      const data = Buffer.from('hello');
      const ownerId = '5555';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId)).toEqual([fragment.id]);
    });

    test('full fragments are returned when requested for a user', async () => {
      const data = Buffer.from('hello');
      const ownerId = '6666';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId, true)).toEqual([fragment]);
    });

    test('setData() throws if not given a Buffer', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain', size: 0 });
      expect(() => fragment.setData()).rejects.toThrow();
    });

    test('setData() updates the fragment size', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));
      expect(fragment.size).toBe(1);

      await fragment.setData(Buffer.from('aa'));
      const { size } = await Fragment.byId('1234', fragment.id);
      expect(size).toBe(2);
    });

    test('a fragment can be deleted', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));

      await Fragment.delete('1234', fragment.id);
      expect(() => Fragment.byId('1234', fragment.id)).rejects.toThrow();
    });

    test('throws an error when setting non-buffer data', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();

      await expect(fragment.setData('Hello World')).rejects.toThrow('Data must be a Buffer');
    });
  });

  describe('convert()', () => {
    test('converts markdown to HTML', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello World'));

      const converted = await fragment.convert('html');
      expect(converted.type).toBe('text/html');
      expect(converted.data).toContain('<h1>Hello World</h1>');
    });

    test('converts JSON to YAML', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from(JSON.stringify({ hello: 'world' })));

      const converted = await fragment.convert('yaml');
      expect(converted.type).toBe('application/yaml');
      expect(converted.data).toContain('hello: world');
    });

    test('converts CSV to JSON', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/csv', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('name,age\nJohn,30\nJane,25'));

      const converted = await fragment.convert('json');
      expect(converted.type).toBe('application/json');
      expect(JSON.parse(converted.data)).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
      ]);
    });

    test('converts image to different formats', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      // Simulate setting PNG image data
      await fragment.setData(Buffer.from(await sharp({ create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toBuffer()));

      const formats = ['jpeg', 'webp', 'gif', 'avif'];
      for (const format of formats) {
        const converted = await fragment.convert(format);
        expect(converted.type).toBe(`image/${format}`);
      }
    });

    test('throws an error when attempting an unsupported conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('This is a plain text'));

      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported conversion for text/csv');
    });

    test('throws an error when trying to convert an image to an unsupported format', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from(await sharp({ create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toBuffer()));

      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported image conversion');
    });

    test('throws an error when converting to an unsupported extension for text/csv', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/csv', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('name,age\nJohn,30\nJane,25'));

      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported conversion for CSV');
    });

    test('throws an error when converting markdown to an unsupported extension', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello World'));

      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported conversion for markdown');
    });

    test('throws an error when converting JSON to an unsupported extension', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from(JSON.stringify({ hello: 'world' })));

      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported conversion for JSON');
    });

    test('throws an error when converting YAML to an unsupported extension', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/yaml', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('hello: world'));

      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported conversion for YAML');
    });
  });

  describe('Fragment constructor', () => {
    test('initializes with valid types and sizes', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 10 });
      expect(fragment.type).toEqual('text/plain');
      expect(fragment.size).toEqual(10);
    });
  
    test('throws error for unsupported MIME types without charset', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'application/xml' })).toThrow(
        'Unsupported type: application/xml'
      );
    });
  
    test('throws error for unsupported MIME types with charset', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'application/xml; charset=utf-8' })).toThrow(
        'Unsupported type: application/xml'
      );
    });
  
    test('correctly sets the id if provided', () => {
      const fragment = new Fragment({ id: 'test-id', ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.id).toEqual('test-id');
    });
  
    test('throws an error if size is not a number', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 'invalid' })).toThrow(
        'size must be a non-negative number'
      );
    });
  });

  
  describe('MIME type handling and conversion logic', () => {
  
    test('correctly converts a text/markdown to text/plain', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown' });
      await fragment.save();
      await fragment.setData(Buffer.from('# Markdown Header'));
  
      const converted = await fragment.convert('txt');
      expect(converted.type).toBe('text/plain');
      expect(converted.data).toEqual('# Markdown Header');
    });
  
    test('handles conversion from JSON to text/plain', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json' });
      await fragment.save();
      await fragment.setData(Buffer.from(JSON.stringify({ key: 'value' })));
  
      const converted = await fragment.convert('txt');
      expect(converted.type).toBe('text/plain');
      expect(converted.data).toContain('"key": "value"');
    });
  });
  
  describe('Convert method edge cases', () => {
    test('throws an error when converting markdown to an unsupported format', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown' });
      await fragment.save();
      await fragment.setData(Buffer.from('# Markdown Header'));
  
      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported conversion for markdown');
    });
  
    test('correctly converts a YAML file to JSON', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/yaml' });
      await fragment.save();
      await fragment.setData(Buffer.from('key: value'));
  
      const converted = await fragment.convert('json');
      expect(converted.type).toBe('application/json');
      expect(JSON.parse(converted.data)).toEqual({ key: 'value' });
    });
  
    test('handles image conversion with uncommon formats', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png' });
      const pngData = Buffer.from(await sharp({ create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toBuffer());
      await fragment.save();
      await fragment.setData(pngData);
  
      const converted = await fragment.convert('avif');
      expect(converted.type).toBe('image/avif');
    });
  });

  describe('Conversion edge cases', () => {
    test('throws an error when trying to convert image to an unsupported format', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png' });
      const pngData = Buffer.from(await sharp({ create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toBuffer());
      await fragment.save();
      await fragment.setData(pngData);
  
      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported image conversion');
    });
  
    test('converts JPEG to PNG', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/jpeg' });
      const jpegData = Buffer.from(await sharp({ create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).jpeg().toBuffer());
      await fragment.save();
      await fragment.setData(jpegData);
  
      const converted = await fragment.convert('png');
      expect(converted.type).toBe('image/png');
    });
  });

  describe('Error handling in setData and convert methods', () => {
    test('throws error when setData is called with non-buffer', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      await fragment.save();
  
      await expect(fragment.setData('Invalid data')).rejects.toThrow('Data must be a Buffer');
    });
  
    test('throws error if convert is called with invalid extension for YAML', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/yaml' });
      await fragment.save();
      await fragment.setData(Buffer.from('key: value'));
  
      await expect(fragment.convert('unsupported')).rejects.toThrow('Unsupported conversion for YAML');
    });
  });
  
  
  describe('Error handling and edge cases', () => {
    test('throws an error when setData is called with non-buffer data', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      await fragment.save();
  
      await expect(fragment.setData('Not a buffer')).rejects.toThrow('Data must be a Buffer');
    });
  
    test('throws an error if convert is called with invalid extension for JSON', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json' });
      await fragment.save();
      await fragment.setData(Buffer.from(JSON.stringify({ key: 'value' })));
  
      await expect(fragment.convert('invalid')).rejects.toThrow('Unsupported conversion for JSON');
    });
  });
  

  describe('getMimeType(extension)', () => {
    const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });

    test('returns correct MIME type for known extensions', () => {
      expect(fragment.getMimeType('html')).toEqual('text/html');
      expect(fragment.getMimeType('txt')).toEqual('text/plain');
    });

    test('defaults to instance mimeType for unknown extensions', () => {
      expect(fragment.getMimeType('pdf')).toEqual('application/json');
    });

    test('returns default MIME type for unknown extensions', () => {
      expect(fragment.getMimeType('unknown')).toEqual('application/json');
    });
  });
});

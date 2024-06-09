const {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
} = require('../../src/model/data/memory/index.js');

describe('In-Memory Database Functionality', () => {
  const fragmentA = { ownerId: 'user123', id: 'a1', fragment: 'sample data A' };
  const fragmentB = { ownerId: 'user123', id: 'b2', fragment: 'sample data B' };

  test('should write fragments and their data to the in-memory DB', async () => {
    await writeFragment(fragmentA);
    await writeFragmentData('user123', 'a1', 'sample data A');

    await writeFragment(fragmentB);
    await writeFragmentData('user123', 'b2', 'sample data B');
  });

  test('should list all fragment IDs for a given owner', async () => {
    const idList = await listFragments('user123');
    expect(Array.isArray(idList)).toBe(true);
    expect(idList).toEqual(['a1', 'b2']);

    const detailedList = await listFragments('user123', true);
    expect(Array.isArray(detailedList)).toBe(true);
    expect(detailedList).toEqual([fragmentA, fragmentB]);
  });

  test('should read a specific fragment by owner and ID', async () => {
    expect(await readFragment('user123', 'a1')).toEqual(fragmentA);
  });

  test('should read the data of a specific fragment', async () => {
    expect(await readFragmentData('user123', 'a1')).toEqual('sample data A');
  });

  test('should delete a specific fragment', async () => {
    expect(await deleteFragment('user123', 'a1')).toBeDefined();
  });
});

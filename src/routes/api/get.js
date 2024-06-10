const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

const getFragments = async (req, res) => {
  try {
    const userId = req.user;
    const expand = req.query.expand === '1';
    const fragments = await Fragment.byUser(userId, expand);
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getExtension = (id) => {
  const parts = id.split('.');
  if (parts.length > 1) {
    const extension = parts.pop();
    const fragmentId = parts.join('.');
    return { fragmentId, extension };
  }
  return { fragmentId: id, extension: null };
};

const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  const { fragmentId, extension } = getExtension(id);
  const ownerId = req.user;

  let fragment, fragmentMetadata;
  try {
    fragmentMetadata = await Fragment.byId(ownerId, fragmentId);
    logger.debug({ fragmentMetadata }, 'Successfully retrieved fragment metadata');
    fragment = new Fragment(fragmentMetadata);
  } catch {
    res.status(404).json(createErrorResponse(404, `Fragment not found: ID ${fragmentId}`));
    return;
  }

  try {
    if (extension) {
      if (extension === 'txt') {
        const fragmentData = await fragment.getData();
        res.status(200).type('text/plain').send(fragmentData);
        return;
      } else {
        res.status(415).json(createErrorResponse(415, 'Requested format is not supported.'));
        return;
      }
    }

    const fragmentData = await fragment.getData();
    res.status(200).type(fragment.mimeType).send(fragmentData);
  } catch {
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};

module.exports = {
  getFragments,
  getFragmentByID,
};

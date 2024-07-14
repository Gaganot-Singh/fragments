const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

const getFragments = async (req, res) => {
  try {
    const userId = req.user;
    const expand = req.query.expand === '1';
    logger.info(`Fetching fragments for user: ${userId}, expand: ${expand}`);
    const fragments = await Fragment.byUser(userId, expand);
    logger.debug({ fragments }, 'Successfully retrieved fragments');
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error({ error }, 'Failed to get fragments');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getExtension = (id) => {
  const parts = id.split('.');
  if (parts.length > 1) {
    const extension = parts.pop();
    const fragmentId = parts.join('.');
    logger.debug(`Parsed ID: ${id}, fragmentId: ${fragmentId}, extension: ${extension}`);
    return { fragmentId, extension };
  }
  logger.debug(`Parsed ID: ${id}, no extension found`);
  return { fragmentId: id, extension: null };
};

const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  const { fragmentId, extension } = getExtension(id);
  const ownerId = req.user;
  logger.info(
    `Fetching fragment by ID: ${fragmentId} for user: ${ownerId} with extension: ${extension}`
  );

  let fragment, fragmentMetadata;
  try {
    fragmentMetadata = await Fragment.byId(ownerId, fragmentId);
    logger.debug({ fragmentMetadata }, 'Successfully retrieved fragment metadata');
    fragment = new Fragment(fragmentMetadata);
  } catch (error) {
    logger.warn({ error }, `Fragment not found: ID ${fragmentId}`);
    res.status(404).json(createErrorResponse(404, `Fragment not found: ID ${fragmentId}`));
    return;
  }

  try {
    if (extension) {
      if (extension === 'txt') {
        const fragmentData = await fragment.getData();
        logger.debug('Returning fragment data as text/plain');
        res.status(200).type('text/plain').send(fragmentData);
        return;
      } else {
        logger.warn(`Unsupported format requested: ${extension}`);
        res.status(415).json(createErrorResponse(415, 'Requested format is not supported.'));
        return;
      }
    }

    const fragmentData = await fragment.getData();
    logger.debug('Returning fragment data with original mimeType');
    res.status(200).type(fragment.mimeType).send(fragmentData);
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve fragment data');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};

const getFragmentInfoByID = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.info(`Fetching fragment info by ID: ${id} for user: ${ownerId}`);

    const fragmentMetadata = await Fragment.byId(ownerId, id);

    logger.debug({ fragmentMetadata }, 'Successfully retrieved fragment metadata');

    res.status(200).json(createSuccessResponse({ fragment: fragmentMetadata }));
  } catch (error) {
    logger.warn({ error }, `Fragment not found: ID ${req.params.id}`);
    res.status(404).json(createErrorResponse(404, `Fragment not found: ID ${req.params.id}`));
  }
};

module.exports = {
  getFragments,
  getFragmentByID,
  getFragmentInfoByID,
};

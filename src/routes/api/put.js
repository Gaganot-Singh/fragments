const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.info(`Attempting to update fragment with ID: ${id} for user: ${ownerId}`);

    // Retrieve the fragment by ID and ownerId
    let fragment;
    try {
      fragment = await Fragment.byId(ownerId, id);
      logger.debug({ fragment }, 'Successfully retrieved fragment metadata for update');
    } catch (error) {
      logger.warn({ error }, `Fragment not found: ID ${id}`);
      return res.status(404).json(createErrorResponse(404, `Fragment not found: ID ${id}`));
    }

    // Validate Content-Type
    const incomingContentType = req.headers['content-type'];
    if (incomingContentType !== fragment.type) {
      logger.warn(`Content-Type mismatch: ${incomingContentType} does not match fragment type ${fragment.type}`);
      return res.status(400).json(createErrorResponse(400, 'Content-Type does not match the fragment\'s type.'));
    }

    // Update the fragment data
    try {
      await fragment.setData(req.body);
      logger.debug({ fragment }, 'Successfully updated fragment data');
    } catch (error) {
      logger.error({ error }, 'Failed to update fragment data');
      return res.status(500).json(createErrorResponse(500, 'Failed to update fragment data'));
    }

    // Respond with the updated fragment metadata
    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error({ error }, 'Unexpected error while updating fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};

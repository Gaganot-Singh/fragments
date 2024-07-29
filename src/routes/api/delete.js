const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');

const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug(`owner id: ${req.user}, id: ${req.params.id}`);
  try {
    await Fragment.delete(req.user, req.params.id.split('.')[0]);
    res.status(200).json(createSuccessResponse());
  } catch (error) {
    logger.debug({ error }, 'Error deleting fragment');
    res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }
};

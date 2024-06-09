const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('Content-Type is not supported for POST');
    return res
      .status(415)
      .json(
        createErrorResponse(
          415,
          'The Content-Type of the fragment being sent with the request is not supported'
        )
      );
  }

  logger.info('v1/fragments POST route works');

  // Get the headers from the request
  const headers = req.headers;
  const contentType = headers['content-type'];

  // Create the fragment metadata
  let fragmentMetadata = new Fragment({
    ownerId: req.user,
    type: contentType,
    size: req.body.length,
  });

  logger.debug({ fragmentMetadata }, 'A fragment is created');
  const host = process.env.API_URL || req.headers.host;

  // Set the Location header
  res.location(host + `/v1/fragments/${fragmentMetadata.id}`);

  // Save fragment metadata
  await fragmentMetadata.save();

  // Save fragment data
  await fragmentMetadata.setData(req.body);

  // Send success response
  res.status(201).json(createSuccessResponse({ fragment: fragmentMetadata }));
};

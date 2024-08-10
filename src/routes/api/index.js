// src/routes/api/index.js

const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const { getFragments, getFragmentByID, getFragmentInfoByID } = require('./get');
const updateFragment = require('./put');

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', getFragments);
router.get('/fragments/:id', getFragmentByID);
router.get('/fragments/:id/info', getFragmentInfoByID);

// Other routes (POST, DELETE, etc.) will go here later on...

router.post('/fragments', rawBody(), require('./post'));

router.delete('/fragments/:id', require('./delete'));

router.put('/fragments/:id', rawBody(), updateFragment); 

module.exports = router;

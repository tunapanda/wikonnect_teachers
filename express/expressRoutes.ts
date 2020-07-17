import express from 'express';
import path from 'path';
import FormData from 'form-data';
import fs from 'fs';
import * as H5P from '../src';
import * as config from './config.json';
import axios from 'axios';
import request from 'request';

import { Logger } from 'tslog';
const log: Logger = new Logger({ name: 'myLogger' });

export default function (
  h5pEditor: H5P.H5PEditor,
  h5pPlayer: H5P.H5PPlayer
): express.Router {
  const router = express.Router();
  router.use((req, res, next) => {
    log.info('Time:', new Date());
    next();
  });

  router.get(`${h5pEditor.config.playUrl}/:contentId`, async (req, res) => {
    try {
      const h5pPage = await h5pPlayer.render(req.params.contentId);
      res.send(h5pPage);
      res.status(200).end();
    } catch (error) {
      res.status(500).end(error.message);
    }
  });

  router.get('/edit/:contentId', async (req, res) => {
    const page = await h5pEditor.render(req.params.contentId);
    res.send(page);
    res.status(200).end();
  });

  router.post('/edit/:contentId', async (req: any, res) => {
    const contentId = await h5pEditor.saveOrUpdateContent(
      req.params.contentId.toString(),
      req.body.params.params,
      req.body.params.metadata,
      req.body.library,
      req.user
    );

    res.send(JSON.stringify({ contentId }));
    res.status(200).end();
  });

  router.get('/new', async (req, res) => {
    const page = await h5pEditor.render(undefined);
    res.send(page);
    res.status(200).end();
  });

  router.post('/new', async (req: any, res) => {
    if (
      !req.body.params ||
      !req.body.params.params ||
      !req.body.params.metadata ||
      !req.body.library ||
      !req.user
    ) {
      res.status(400).send('Make sure you create the h5p before you click preview , Refresh page to retry ').end();
      return;
    }
    const contentId = await h5pEditor.saveOrUpdateContent(
      undefined,
      req.body.params.params,
      req.body.params.metadata,
      req.body.library,
      req.user
    );

    log.info(contentId);
    res.setHeader(
      'Content-disposition',
      `attachment; filename=${contentId}.h5p`
    );

    const writeStream = fs.createWriteStream(`h5p/temporary-storage/${contentId}.h5p`);
    const packageFinishedPromise = new Promise((resolve) => {
      writeStream.on('close', () => {
        resolve();
      });
    });
    await h5pEditor.exportContent(contentId, writeStream, req.user);
    await packageFinishedPromise;
    writeStream.close();

    const url = `${config.wikonnectApiUrl}chapters/${req.session.chapter_id}/upload`;

    log.info(url);

    const options = {
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'multipart-formdata'
      },
      formData: {
        file: {
          value: fs.createReadStream(`h5p/temporary-storage/${contentId}.h5p`),
          options: {
            filename: `${contentId}.h5p`,
            contentType: null
          }
        }
      }
    };
    request(options, (error, response) => {
      // if (error.code === "EPIPE") {
      //   process.exit(0);
      // }
      if (error) {
        log.error(error.message);
        // throw new Error(error);
      }
      log.info(response);
      log.info('redirecting');
      log.info(JSON.stringify({ contentId }));
      res.send(JSON.stringify({ contentId }));
      res.status(200).end();
    });
  });

  router.get('/delete/:contentId', async (req: any, res) => {
    try {
      await h5pEditor.deleteContent(req.params.contentId, req.user);
    } catch (error) {
      res.send(
        `Error deleting content with id ${req.params.contentId}: ${error.message}<br/><a href="javascript:window.location=document.referrer">Go Back</a>`
      );
      res.status(500).end();
      return;
    }

    res.send(
      `Content ${req.params.contentId} successfully deleted.<br/><a href="javascript:window.location=document.referrer">Go Back</a>`
    );
    res.status(200).end();
  });

  return router;
}

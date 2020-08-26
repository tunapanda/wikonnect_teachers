import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import request from 'request';
import * as config from './config.json';

import { Logger } from 'tslog';
const log: Logger = new Logger({ name: 'myLogger' });

// let storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// })

export default function (): express.Router {
  const router = express.Router();
  // router.use(fileUpload({
  //   useTempFiles: true,
  //   tempFileDir: '/uploads/'
  // }));
  router.use((req, res, next) => {
    log.info('Time:', new Date());
    //log.info(req.body);
    next();
  });

  router.post('/login', async (req: any, res: any) => {
    const url = config.wikonnectApiUrl + 'auth';
    log.info(url)
    axios
      .post(url, {
        username: req.body.username,
        password: req.body.password
      })
      .then((response) => {
        if (req.session.token) {
          req.session.destroy();
        }
        req.session.token = response.data.token;
        req.session.username = req.body.username;
        res.redirect('/');
      })
      .catch((error) => {
        res.redirect('/login?error=denied');
      });
  });

  router.get('/auth', async (req: any, res: any) => {
    req.session.token = req.query.token;
    req.session.username = req.query.user;
    res.redirect('/');
  });

  router.post('/upload', async (req: any, res: any) => {
    log.info(req.files.file); // the uploaded file object
    const thumb = req.files.file;
    const stamp = Date.now();
    const tempFile = `./uploads/thumb_${stamp}.jpg`;
    const tempFile2 = `uploads/thumb_${stamp}.jpg`;
    thumb.mv(tempFile, (err) => {
      if (err) {
        log.error('save failed');
        log.error(err);
      } else {
        log.info('posting to', `${config.wikonnectApiUrl}chapters/${req.session.chapter_id}/chapter-image`); // the uploaded file object
        const _url = `${config.wikonnectApiUrl}chapters/${req.session.chapter_id}/chapter-image`;
        const options = {
          method: 'POST',
          url: _url,
          headers: {
            "Authorization": `Bearer ${req.session.token}`
          },
          formData: {
            file: {
              value: fs.createReadStream(tempFile2),
              options: {
                filename: 'i.jpg',
                contentType: null
              }
            }
          }
        };
        log.info('saved');
        request(options, (error: string, response: { body: any }) => {
          if (error) throw new Error(error);
          res.redirect('/publish');
        });
      }
    });
  });

  router.post('/chapters', async (req: any, res: any) => {
    const url = `${config.wikonnectApiUrl}chapters`;
    log.info(req.body);
    log.info(url);
    axios
      .post(
        url,
        {
          chapter: {
            name: req.body.name,
            description: req.body.description,
            status: 'draft',
            creatorId: req.session.username,
            approved: false,
            lessonId: '1'
          }
        },
        { headers: { Authorization: `Bearer ${req.session.token}` } }
      )
      .then((response) => {
        log.info('response.data');
        log.info('response.data');

        log.info(response.data);
        req.session.chapter_id = response.data.chapter.id;
        // res.redirect('/');§
        res.redirect('/h5p/new');
      })
      .catch((error) => {
        log.error('error');
        res.redirect('/logout');
      });
  });

  router.post('/chapters/edit/:id', async (req: any, res: any) => {
    const url = `${config.wikonnectApiUrl}chapters/${req.params.id}`;
    log.info(req.body);
    log.info(url);
    axios
      .put(
        url,
        {
          chapter: {
            name: req.body.name,
            description: req.body.description,
            status: 'draft',
            creatorId: req.session.username,
            approved: false,
            lessonId: '1'
          }
        },
        { headers: { Authorization: `Bearer ${req.session.token}` } }
      )
      .then((response) => {
        log.info('response.data');
        log.info('response.data');

        log.info(response.data);
        req.session.chapter_id = response.data.chapter.id;
        // res.redirect('/');§
        res.redirect('/');
      })
      .catch((error) => {
        log.error('error');
        log.error(error);
        res.redirect('/logout');
      });
  });

  router.post('/publish', async (req: any, res: any) => {
    let _url = `${config.wikonnectApiUrl}chapters/${req.session.chapter_id}`;
    log.info(req.body);
    log.info(_url);
    axios
      .put(
        _url,
        { chapter: { status: 'published' } },
        { headers: { Authorization: `Bearer ${req.session.token}` } }
      )
      .then((response) => {
        log.info('response.data');
        log.info('response.data');
        log.info(response.data);
        req.session.chapter_id = response.data.chapter.id;
        // res.redirect('/');§
        res.redirect('/publish?intent=success');
      })
      .catch((error) => {
        log.error('error');
        res.redirect('/logout');
      });
  });


  router.get('/delete/:id', async (req: any, res: any) => {
    let _url = `${config.wikonnectApiUrl}chapters/${req.params.id}`;
    //log.info(req.body);
    log.info(_url);
    console.log(req.session.token)
    axios.delete(
      _url,
      { headers: { Authorization: `Bearer ${req.session.token}` } }
    )
      .then((response) => {
        log.info('response.data');
        //log.info(response.data);
        req.session.chapter_id = response.data.chapter.id;
        // res.redirect('/');§
        //res.redirect('/home');
      })
      .catch((error) => {
        log.error('error');
        log.error(error);
        //res.redirect('/logout');
      });
  });


  router.post('/unpublish', async (req: any, res: any) => {
    const _url = `${config.wikonnectApiUrl}chapters/${req.session.chapter_id}`;
    log.info(req.body);
    log.info(_url);
    axios
      .put(
        _url,
        { chapter: { status: 'draft', approval: "true" } },
        { headers: { Authorization: `Bearer ${req.session.token}` } }
      )
      .then((response) => {
        log.info('response.data');
        log.info('response.data');
        log.info(response.data);
        req.session.chapter_id = response.data.chapter.id;
        // res.redirect('/');§
        res.redirect('/publish?intent=success');
      })
      .catch((error) => {
        log.error('error');
        res.redirect('/logout');
      });
  });

  return router;
}

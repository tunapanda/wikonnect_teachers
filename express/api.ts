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
        log.info(req.body);
        next();
    });

    router.post('/login', async (req: any, res: any) => {
        const url = 'http://localhost:3000/api/v1/auth';

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
        const temp_file = './uploads/thumb_' + stamp + '.jpg';
        const temp_file2 = 'uploads/thumb_' + stamp + '.jpg';
        thumb.mv(temp_file, (err) => {
            if (err) {
                log.error('save failed');
                log.error(err);
            } else {
                log.info(
                    'posting to',
                    config.wikonnectApiUrl +
                        'chapters/' +
                        req.session.chapter_id +
                        '/chapter-image'
                ); // the uploaded file object
                const _url =
                    config.wikonnectApiUrl +
                    'chapters/' +
                    req.session.chapter_id +
                    '/chapter-image';
                const options = {
                    method: 'POST',
                    url: _url,
                    headers: {
                        Authorization:
                            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoidXNlcjEiLCJlbWFpbCI6InVzZXIxQHdpa29ubmVjdC5vcmciLCJ1c2VybmFtZSI6InVzZXIxIiwibGFzdFNlZW4iOiIyMDE3LTEyLTIwIDE5OjE3OjEwIiwibGFzdElwIjoiMjQ1LjE5LjIyNS41NSIsIm1ldGFkYXRhIjp7Iml0ZW1zIjp7InF0eSI6MjQsInByb2R1Y3QiOiJEaWFwZXIifSwiY3VzdG9tZXIiOiJMaWx5IEJ1c2gifSwiY3JlYXRlZEF0IjoiMjAxNy0xMi0yMFQxNjoxNzoxMC4wMDBaIiwidXBkYXRlZEF0IjoiMjAxNy0xMi0yMFQxNjoxNzoxMC4wMDBaIiwicHJvZmlsZVVyaSI6bnVsbCwiaW52aXRlQ29kZSI6bnVsbCwicm9sZSI6ImFkbWluIn0sImV4cCI6MTU5MDYzMDU2NiwiaWF0IjoxNTkwMDI1NzY2fQ.4LP4xtmUwOqDLhSJlXj01gg1fjosjoupHeS6_ELwgR8'
                    },
                    formData: {
                        file: {
                            value: fs.createReadStream(temp_file2),
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
                    log.info(response.body);
                    res.redirect('/publish');
                });
            }
        });
    });

    router.post('/chapters', async (req: any, res: any) => {
        let _url = config.wikonnectApiUrl + 'chapters';
        log.info(req.body);
        log.info(_url);
        axios
            .post(
                _url,
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

    router.post('/publish', async (req: any, res: any) => {
        let _url =
            config.wikonnectApiUrl + 'chapters/' + req.session.chapter_id;
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
    router.post('/unpublish', async (req: any, res: any) => {
        let _url =
            config.wikonnectApiUrl + 'chapters/' + req.session.chapter_id;
        log.info(req.body);
        log.info(_url);
        axios
            .put(
                _url,
                { chapter: { status: 'draft' } },
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

import express from 'express';
import * as config from './config.json';
import axios from 'axios';
import { Logger } from 'tslog';
const log: Logger = new Logger({ name: 'myLogger' });

export default function (): express.Router {
    const router = express.Router();

    router.use((req: any, res: any, next) => {
        log.info('Tisme:', new Date());
        log.info(req.body);
        next();
    });

    router.get('/', async (req: any, res: any) => {
        if (!req.session.token) {
            res.redirect('/login?error=denied');
        } else {
            const url = config.wikonnectApiUrl + 'chapters/teach';

            axios
                .get(url, {
                    headers: { Authorization: `Bearer ${req.session.token}` }
                })
                .then((response) => {
                    log.info('response.data');
                    log.info(response.data);
                    res.render('home', { chapters: response.data.chapter });
                })
                .catch((error) => {
                    res.redirect('/login?error=denied');
                });
            //Index shows list of chapters
        }
    });

    router.get('/thumbnail', async (req: any, res: any) => {
        if (!req.session.token) {
            res.redirect('/login?error=denied');
        } else {
            res.render('thumbnail', { sess: req.session });
            //Index shows list of chapters
        }
    });

    // router.get('/publish', async (req: any, res: any) => {
    //   if (!req.session.token) {
    //     //     res.redirect('/login?error=denied');
    //     //   } else {
    //     const url = config.wikonnectApiUrl + "chapters/" + req.session.chapter_id;
    //     log.info(req.body)
    //     log.info(url)
    //     axios.put(url, { "chapter": { "status": "published" } }, { headers: { "Authorization": `Bearer ${req.session.token}` } })
    //       .then((response) => {
    //         log.info("response.data")
    //         log.info("response.data")
    //         log.info(response.data)
    //         // req.session.chapter_id = response.data.chapter.id
    //         // // res.redirect('/');§
    //         // res.redirect('/publish?intent=success');
    //         res.render('success', { "chapter": response.data.chapter[0] });
    //       })
    //       .catch((error) => {
    //         res.redirect('/login?error=denied');
    //       })
    //   }
    // });

    router.get('/publish', async (req: any, res: any) => {
        if (!req.session.token) {
            res.redirect('/login?error=denied');
        } else {
            const url =
                config.wikonnectApiUrl +
                'chapters/teach/' +
                req.session.chapter_id;
            await axios
                .get(url, {
                    headers: { Authorization: `Bearer ${req.session.token}` }
                })
                .then((response) => {
                    log.info('response.data');
                    log.info(
                        '------------------------------------------------------'
                    );
                    log.info(response.data);
                    // res.render('home', { "sess": req.session });
                    res.render('success', {
                        chapter: response.data.chapter[0]
                    });
                })
                .catch((error) => {
                    res.redirect('/login?error=denied');
                });
            //Index shows list of chapters
        }
    });

    router.get('/redirector/:id', async (req: any, res: any) => {
        if (!req.session.token) {
            res.redirect('/login?error=denied');
        } else {
            log.info(req.params.id);
            log.info('------------------------------------------------------');
            req.session.chapter_id = req.params.id;
            res.redirect('/' + req.query.intent);
            //Index shows list of chapters
        }
    });
    return router;
}

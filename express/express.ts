import bodyParser from 'body-parser';
import express from 'express';
import fileUpload from 'express-fileupload';
import i18next from 'i18next';
import i18nextExpressMiddleware from 'i18next-express-middleware';
import i18nextNodeFsBackend from 'i18next-node-fs-backend';
import os from 'os';
import path from 'path';
import exphbs from 'express-handlebars';
import * as H5P from '../src';
import expressRoutes from './expressRoutes';
import routes from './routes';
import api from './api';
import startPageRenderer from './startPageRenderer';
import User from './User';
import session from 'express-session';

import hbshelpers from 'handlebars-helpers';

import { Logger } from 'tslog';
const log: Logger = new Logger({ name: 'myLogger' });

/**
 * Displays links to the server at all available IP addresses.
 * @param port The port at which the server can be accessed.
 */
function displayIps(port: string): void {
    // tslint:disable-next-line: no-console
    log.info('Example H5P NodeJs server is running:');
    const networkInterfaces = os.networkInterfaces();
    // tslint:disable-next-line: forin
    for (const devName in networkInterfaces) {
        networkInterfaces[devName]
            .filter((int) => !int.internal)
            .forEach((int) =>
                // tslint:disable-next-line: no-console
                log.info(
                    `http://${int.family === 'IPv6' ? '[' : ''}${int.address}${
                        int.family === 'IPv6' ? ']' : ''
                    }:${port}`
                )
            );
    }
}

const start = async () => {
    await i18next
        .use(i18nextNodeFsBackend)
        .use(i18nextExpressMiddleware.LanguageDetector)
        .init({
            backend: {
                loadPath: 'assets/translations/{{ns}}/{{lng}}.json'
            },
            debug: process.env.DEBUG && process.env.DEBUG.includes('i18n'),
            defaultNS: 'server',
            fallbackLng: 'en',
            ns: ['server', 'storage-file-implementations'],
            preload: ['en']
        });

    const config = await new H5P.H5PConfig(
        new H5P.fsImplementations.JsonStorage(
            path.resolve('express/config.json')
        )
    ).load();

    const h5pEditor = H5P.fs(
        config,
        path.resolve('h5p/libraries'), // the path on the local disc where libraries should be stored
        path.resolve('h5p/temporary-storage'), // the path on the local disc where temporary files (uploads) should be stored
        path.resolve('h5p/content') // the path on the local disc where content is stored
    );

    const h5pPlayer = new H5P.H5PPlayer(
        h5pEditor.libraryStorage,
        h5pEditor.contentStorage,
        config
    );

    const server = express();

    server.use(
        session({
            key: 'user_sid',
            secret: 'somerandonstuffs',
            resave: false,
            saveUninitialized: false,
            cookie: {
                expires: 600000
            }
        })
    );
    server.use(express.static('public'));
    const multihelpers = hbshelpers();

    server.engine(
        'handlebars',
        exphbs({
            helpers: multihelpers
        })
    );
    server.set('view engine', 'handlebars');

    server.enable('trust proxy');
    server.use(bodyParser.json({ limit: '500mb' }));
    server.use(
        bodyParser.urlencoded({
            extended: true
        })
    );
    server.use(
        fileUpload({
            limits: { fileSize: h5pEditor.config.maxFileSize }
        })
    );

    server.use((req: any, res: any, next) => {
        req.user = new User();
        next();
    });

    server.use(i18nextExpressMiddleware.handle(i18next));

    server.use(
        h5pEditor.config.baseUrl,
        H5P.adapters.express(
            h5pEditor,
            path.resolve('h5p/core'), // the path on the local disc where the files of the JavaScript client of the player are stored
            path.resolve('h5p/editor') // the path on the local disc where the files of the JavaScript client of the editor are stored
        )
    );

    server.use(h5pEditor.config.baseUrl, expressRoutes(h5pEditor, h5pPlayer));
    server.use('/api', api());

    server.use('/', routes());
    server.get('/sess', function (req: any, res: any) {
        res.send(req.session.token);
    });

    server.get('/logout', function (req: any, res: any) {
        req.session.destroy();
        res.redirect('/login');
    });

    server.get('/login', function (req: any, res: any) {
        if (req.session.token) {
            res.redirect('/');
        } else {
            if (req.query.error == 'denied') {
                res.render('login', { msg: 'Check username and password' });
            } else if (req.query.error == 'permission') {
                res.render('login', { msg: 'Login to view page' });
            } else {
                res.render('login');
            }
        }
    });

    const port = process.env.PORT || '8080';
    displayIps(port);
    server.listen(port);
};

start();

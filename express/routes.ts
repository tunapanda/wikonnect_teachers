import express from 'express';
import * as config from './config.json';
import axios from 'axios';

export default function (): express.Router {
  const router = express.Router();


  router.use((req: any, res: any, next) => {
    console.log("Tisme:", new Date())
    console.log(req.body)

    // if (!req.session.token) {


    //   if (req.route.path !== '/login')
    //     res.redirect('/login');
    //   next();
    // } else {
    //   next();
    // }

    next();

  })




  router.get('/', async (req: any, res: any) => {
    if (!req.session.token) {
      res.redirect('/login?error=denied');
    } else {
      let _url = config.wikonnectApiUrl + "chapters/teach"

      axios.get(_url, { headers: { "Authorization": `Bearer ${req.session.token}` } })
        .then(function (response) {

          console.log("response.data")
          console.log(response.data)
          res.render('home', { "chapters": response.data.chapter });
        })
        .catch(function (error) {
          res.redirect('/login?error=denied');
        })
      //Index shows list of chapters

    }
  });


  router.get('/thumbnail', async (req: any, res: any) => {
    if (!req.session.token) {
      res.redirect('/login?error=denied');
    } else {

      res.render('thumbnail', { "sess": req.session });

      //Index shows list of chapters

    }
  });


  router.get('/redirector/:id', async (req: any, res: any) => {
    if (!req.session.token) {
      res.redirect('/login?error=denied');
    } else {
      req.session.chapter_id = req.params.id
      res.redirect('/' + req.query.intent);
      //Index shows list of chapters

    }
  });





  router.get('/publish', async (req: any, res: any) => {
    if (!req.session.token) {
      res.redirect('/login?error=denied');
    } else {



      let _url = config.wikonnectApiUrl + "chapters/teach/" + req.session.chapter_id

      axios.get(_url, { headers: { "Authorization": `Bearer ${req.session.token}` } })
        .then(function (response) {

          console.log("response.data")
          console.log(response.data)
          // res.render('home', { "sess": req.session });

          res.render('success', { "chapter": response.data.chapter[0] });
        })
        .catch(function (error) {
          res.redirect('/login?error=denied');

        })





      //Index shows list of chapters

    }
  });







  return router;
}

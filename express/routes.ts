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
      let _url = config.wikonnectApiUrl + "chapters?creator_id=" + req.session.username

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







  return router;
}

import express from 'express';
import * as config from './config.json';
import axios from 'axios';

export default function (): express.Router {
  const router = express.Router();
  router.use((req, res, next) => {
    console.log("Time:", new Date())
    console.log(req.body)
    next()
  })






  router.post('/login', async (req, res) => {
    let _url = config.wikonnectApiUrl + "auth"

    const login_request = await axios.post(_url, {
      username: req.body.username,
      password: req.body.password,
    }
    )
      .then(function (response) {
        console.log(response.data.token)
        if (req.session.token) {
          req.session.destroy();
        }
        req.session.token = response.data.token;
        req.session.username = req.body.username;
        res.redirect('/');
      })
      .catch(function (error) {
        res.redirect('/login?error=denied');
      })
  });

  router.get('/auth', async (req, res) => {
    console.log(req);


        req.session.token = req.query.token;
        req.session.username = req.query.user;
        res.redirect('/');
    
  });




  router.post('/chapters', async (req, res) => {
    let _url = config.wikonnectApiUrl + "chapters"
    console.log(req.body)
    console.log(_url)
    axios.post(_url, {
      "chapter": {
        "name": req.body.name,
        "description": req.body.description,
        "status": "published",
        "creatorId": req.session.username,
        "lessonId": "1"
      }
    }, { headers: { "Authorization": `Bearer ${req.session.token}` } })
      .then(function (response) {

        console.log("response.data")

        console.log(response.data)
        req.session.chapter_id = response.data.chapter.id
        // res.redirect('/');§
        res.redirect('/h5p/new');

      })
      .catch(function (error) {
        res.redirect('/login?error=denied');
      })

  });


  return router;
}

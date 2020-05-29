import express from 'express';

import fs from 'fs';
import path from 'path';

import * as config from './config.json';
import axios from 'axios';

import multer from 'multer'
import request from 'request'



// let storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// })

var upload = multer({ dest: 'uploads/' })

export default function (): express.Router {
  const router = express.Router();
  // router.use(fileUpload({
  //   useTempFiles: true,
  //   tempFileDir: '/uploads/'
  // }));
  router.use((req, res, next) => {
    console.log("Time:", new Date())
    console.log(req.body)
    next()
  })






  router.post('/login', async (req: any, res: any) => {
    let _url = config.wikonnectApiUrl + "auth"

    axios.post(_url, {
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

  router.get('/auth', async (req: any, res: any) => {
    console.log(req);


    req.session.token = req.query.token;
    req.session.username = req.query.user;
    res.redirect('/');

  });


  router.post('/upload', async (req: any, res: any) => {
    console.log(req.files.file); // the uploaded file object
    var thumb = req.files.file;
    var stamp = Date.now();
    var temp_file = "./uploads/thumb_" + stamp + ".jpg"
    var temp_file2 = "uploads/thumb_" + stamp + ".jpg"
    thumb.mv(temp_file, function (err) {
      if (err) {
        console.log("save failed");
        console.log(err);
      } else {
        console.log("saved");



        console.log(req.body); // the uploaded file object
        console.log('posting to', config.wikonnectApiUrl + 'chapters/' + req.session.chapter_id + '/chapter-image'); // the uploaded file object
        var _url = config.wikonnectApiUrl + 'chapters/' + req.session.chapter_id + '/chapter-image'






        var options = {
          'method': 'POST',
          'url': _url,
          'headers': {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoidXNlcjEiLCJlbWFpbCI6InVzZXIxQHdpa29ubmVjdC5vcmciLCJ1c2VybmFtZSI6InVzZXIxIiwibGFzdFNlZW4iOiIyMDE3LTEyLTIwIDE5OjE3OjEwIiwibGFzdElwIjoiMjQ1LjE5LjIyNS41NSIsIm1ldGFkYXRhIjp7Iml0ZW1zIjp7InF0eSI6MjQsInByb2R1Y3QiOiJEaWFwZXIifSwiY3VzdG9tZXIiOiJMaWx5IEJ1c2gifSwiY3JlYXRlZEF0IjoiMjAxNy0xMi0yMFQxNjoxNzoxMC4wMDBaIiwidXBkYXRlZEF0IjoiMjAxNy0xMi0yMFQxNjoxNzoxMC4wMDBaIiwicHJvZmlsZVVyaSI6bnVsbCwiaW52aXRlQ29kZSI6bnVsbCwicm9sZSI6ImFkbWluIn0sImV4cCI6MTU5MDYzMDU2NiwiaWF0IjoxNTkwMDI1NzY2fQ.4LP4xtmUwOqDLhSJlXj01gg1fjosjoupHeS6_ELwgR8'
          },
          formData: {
            'file': {
              'value': fs.createReadStream('uploads/i.jpg'),
              'options': {
                'filename': 'i.jpg',
                'contentType': null
              }
            }
          }
        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          console.log(response.body);
        });
      }
    });








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
        console.log("response.data")

        console.log(response.data)
        req.session.chapter_id = response.data.chapter.id
        // res.redirect('/');§
        res.redirect('/h5p/new');

      })
      .catch(function (error) {
        console.log("error")
        res.redirect('/logout');
      })

  });


  return router;
}

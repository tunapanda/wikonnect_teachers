module.exports = {
    apps : [{
      name: 'teach',
      script: 'wikonnect-teacher/build/express/express.js',
      watch: ['express'],
      watch_delay: 1000,
      ignore_watch: ['uploads', 'h5p', 'node_modules', 'build' ]
    }],

    deploy : {
      production : {
        user : 'SSH_USERNAME',
        host : 'SSH_HOSTMACHINE',
        ref  : 'origin/master',
        repo : 'GIT_REPOSITORY',
        path : 'DESTINATION_PATH',
        'pre-deploy-local': '',
        'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
        'pre-setup': ''
      }
    }
  };
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'aishatech19@gmail.com', pass: 'xeoagsrtrzfnfpar' }
});
t.sendMail({
  from: 'aishatech19@gmail.com',
  to: 'silynxar@gmail.com',
  subject: 'Test',
  text: 'Test email'
}, (err, info) => {
  if(err) console.error('ERROR:', err.message);
  else console.log('SUCCESS:', info.response);
});
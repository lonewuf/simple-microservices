const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsPostById = {

}

app.get('/posts/:postId/comments', (req, res) => {
  res.send(commentsPostById[req.params.postId] || []);
})

app.post('/posts/:postId/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;

  const comments = commentsPostById[req.params.postId] || [];

  comments.push({ id: commentId, content, status: 'pending' });
  commentsPostById[req.params.postId] = comments;

  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.postId,
      status: 'pending'
    }
  })

  res.status(201).send(comments);
})

app.post('/events', async (req, res) => {
  console.log('Event Recieved: ', req.body.type);

  const { type, data } = req.body;

  if (type === 'CommentModerated') {
    const { id, postId, status, content } = data;
    const comments = commentsPostById[postId];

    const comment = comments.find(comment => comment.id === id);
    comment.status = status;

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        content,
        status,
        postId
      }
    })
  }

  res.send({});
})

const port = 4001;
app.listen(port, () => {
  console.log(`Listening in port ${port}`);
})
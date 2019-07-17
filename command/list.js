const templates = require('../templates');

module.exports = () => {
  templates.all.forEach(t => {
    console.log(t);
  });
}
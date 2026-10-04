import { createApp } from './app.js';
import { config } from './config.js';

const { app } = createApp(config);
app.listen(config.port, () => {
  console.log(`Tablebook API listening on http://localhost:${config.port}`);
  if (config.adminKey === 'admin-demo') console.log('Using the demo admin key "admin-demo" – set ADMIN_KEY for real use.');
});

import env from './Config/env.js';
import app from './App.js';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at ${env.BASE_URL}`);
});

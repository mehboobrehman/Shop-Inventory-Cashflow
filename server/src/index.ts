import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const port = env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

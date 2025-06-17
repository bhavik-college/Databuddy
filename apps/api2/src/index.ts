import { Elysia } from "elysia";
import domainsRouter from "./routes/v1/domains";

const app = new Elysia();

app.get('/', () => {
  return 'Hello World';
})
.use(domainsRouter)

app.listen(3500)
.onStart(() => {
  console.log('Server is running on port 3500');
});

app.onError(({ error, code }) => {
  console.error(error);
  return {
    success: false,
    code: code
  };
});
import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";

const app: Application = express();
const port: Number = 8090;

app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

app.get("/api/heartbeat", (req: Request, res: Response) => {
	res.send("OK");
});

app.get("/api", (req: Request, res: Response) => {
	res.send("Hello, World");
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

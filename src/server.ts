import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { Pool } from "pg";

const app: Application = express();

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_wgCFK8GnYTo4@ep-snowy-darkness-apivuuuy-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const initDB = async () => {
  try {
    await pool.query(`
  CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL ,
    password TEXT NOT NULL,
  
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`);

    console.log("Database initialized successfully");
  } catch (error) {
    console.log(error);
  }
};

initDB();

const port = 5000;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  //   res.send('The DevPlus TypeScript Server is running!')

  res.status(200).json({
    message: "The DevPlus TypeScript Server is running!",
  });
});

app.post("/api/users", async (req: Request, res: Response) => {
  // console.log(req.body)
  const { name, email, password, created_at, updated_at } = req.body;
  try
  {
    const result = await pool.query(
    `INSERT INTO users (name, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, password, created_at, updated_at],
  );

  // console.log(result);

  res.status(201).json({
    success: true,
    message: "user registered successfully",
    data: result.rows[0],
  });
  }
  catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
      error : error,
    });
  }
});

app.get('/api/users', async(req: Request, res: Response)=> {
  try {
    const result = await pool.query(`SELECT * FROM users`);
    res.status(200).json({
      success: true,
      message: "users retrieved successfully",
      data: result.rows,
    })
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
      error : error,
    });
  }
});

app.get('/api/users/:id', async(req : Request, res : Response)=>{
  const {id} = req.params;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    res.status(200).json({
      success: true,
      message: "user retrieved successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
      error : error,
    });
  }

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

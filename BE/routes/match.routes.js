import { Router } from "express";
import { makeMove } from "../controllers/match.controller.js";

const router = Router();

router.post("/move", makeMove);

export default router;

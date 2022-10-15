import express, { Router, Request, Response } from "express";
import { Resolver } from "inversify.config";
import { MessageManagement, MESSAGE_TYPES } from "messages";

const router: Router = express.Router();

router.delete("/:messageId", async (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  if (messageId) {
    const manager: MessageManagement = Resolver.get<MessageManagement>(
      MESSAGE_TYPES.MessageManager
    );
    const deleted = await manager.deleteMessage(messageId);

    if (deleted) {
      res.status(200).json({
        message: "Successfully deleted message.",
      });
    } else {
      res.status(500).json({
        message: "An error occured, please check the aggregator logs.",
      });
    }
  } else {
    res.status(400).json({
      message: "No message id provided.",
    });
  }
});

export default router;

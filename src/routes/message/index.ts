import express, { Router, Request, Response } from "express";
import { SERVICE_TYPES } from "../../service/inversify.types";
import { Service } from "../../service/types";
import { Resolver } from "../../inversify.config";
import ServiceManagement from "../../service/interfaces/ServiceManagement";
import MessageManagement from "../../messages/interfaces/MessageManagement";
import { MESSAGE_TYPES } from "../../messages/inversify.types";

const router: Router = express.Router();
// POST /service/add
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

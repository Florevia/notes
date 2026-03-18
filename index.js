import * as Lark from "@larksuiteoapi/node-sdk";
const baseConfig = {
  appId: "cli_a93fa5d5eb785cc5",
  appSecret: "Cu1hqTtuPrtDpwN95091hhiJVN5EJ25o",
};
const client = new Lark.Client(baseConfig);
const wsClient = new Lark.WSClient({
  ...baseConfig,
  loggerLevel: Lark.LoggerLevel.debug,
});
wsClient.start({
  // 处理「接收消息」事件，事件类型为 im.message.receive_v1
  eventDispatcher: new Lark.EventDispatcher({}).register({
    "im.message.receive_v1": async (data) => {
      const {
        message: { chat_id, content },
      } = data;
      // 示例操作：接收消息后，调用「发送消息」API 进行消息回复。
      await client.im.v1.message.create({
        params: {
          receive_id_type: "chat_id",
        },
        data: {
          receive_id: chat_id,
          content: Lark.messageCard.defaultCard({
            title: `回复： ${JSON.parse(content).text}`,
            content: "新年好",
          }),
          msg_type: "interactive",
        },
      });
    },
  }),
});

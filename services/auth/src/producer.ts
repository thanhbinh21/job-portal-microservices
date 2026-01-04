import { Kafka, Producer, Admin } from "kafkajs";
import dotenv from "dotenv";

let producer: Producer;
let admin: Admin;

dotenv.config();
export const connectKafka = async () => {
  try {
    const kafka = new Kafka({
      clientId: "auth-service",
      brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
    });

    admin = kafka.admin();
    await admin.connect();

    const topic = await admin.listTopics();

    if (!topic.includes("send-mail")) {
      await admin.createTopics({
        topics: [
          { topic: "send-mail", numPartitions: 1, replicationFactor: 1 },
        ],
      });

      console.log("✅ Kafka Admin connected and topic 'send-mail' created");
    }

    await admin.disconnect();
    producer = kafka.producer();

    await producer.connect();
    console.log("✅ Kafka Producer connected");
  } catch (error) {
    console.error("❌ Error connecting Kafka Producer:", error);
  }
};

export const publishToTopic = async (topic: string, message: any) => {
  try {
    if (!producer) {
      console.error("❌ Kafka Producer is not connected");
      return;
    }
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`✅ Message published to topic ${topic}`);
  } catch (error) {
    console.error(`❌ Error publishing message to topic ${topic}:`, error);
  }
};

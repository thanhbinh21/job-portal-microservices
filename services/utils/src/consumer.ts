import { Kafka } from "kafkajs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
export const startSendMailConsumer = async () => {
  try {
    const kafka = new Kafka({
      clientId: "utils-mail-service",
      brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
    });

    const consumer = kafka.consumer({ groupId: "utils-mail-service-group" });

    await consumer.connect();
    const topicName = "send-mail";
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log("✅ Mail Service is listening for messages...");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const { to, subject, html } = JSON.parse(
            message.value?.toString() || "{}"
          );

          const tranporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
          });

            await tranporter.sendMail({ 
                from: process.env.EMAIL_USER,
                to,
                subject,
                html,
            });

            console.log(`✅ Email sent to ${to} with subject: ${subject}`);
        } catch (error) {
            console.error("❌ Error sending email:", error);
        }
      },
    });
  } catch (error) {
    console.error("❌ Error in Mail Service consumer:", error);
  }
};

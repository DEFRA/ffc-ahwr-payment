import cron from "node-cron";
import config from "../../config";

export default {
    plugin: {
        name: "processPaymentDataScheduler",
        register: async (server) => {
            server.logger.info(
                {
                    schedule: config.processPaymentDataScheduler,
                },
                "registering schedule for processing payment data",
            );

            cron.schedule(
                config.processPaymentDataScheduler.schedule,
                async () => {
                    const logger = server.logger.child({});
                    try {
                        logger.info("processing payment data");
                        // get latest unsuccessful payments (getAllSuccessfulPayments)
                        // check payment details for each payment (dunno how to do this yet)
                        // update if successful (updateByReference)
                    } catch (err) {
                        logger.error({ err }, "error processing payment data");
                    }
                },
                {
                    scheduled: config.processPaymentDataScheduler.enabled,
                },
            );
        },
    }
}
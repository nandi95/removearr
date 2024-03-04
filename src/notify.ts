import tautulliRequest from "./tautulli/tautulliRequest.ts";
import config from "./constants/config.ts";

/**
 * Send a notification to everyone who is subscribed to this notifier
 * @param subject
 * @param body
 */
export default async function notify(subject:string, body: string) {
    if (!config.notifierId) {
        throw new Error('Notifier ID is not set');
    }

    await tautulliRequest('notify', {
        method: 'POST',
        body: {
            subject,
            body,
        }
    })
}

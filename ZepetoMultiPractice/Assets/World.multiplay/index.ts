import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";

export default class extends Sandbox {

    onCreate(options: SandboxOptions) {
        console.log("OnCreate!!!!");
        this.onMessage?.("echo", (client, message) => {
            console.log(`Echo onMessage from ${client.sessionId}, -> ${message}`);

            // Send current client
            client.send("echo", "echo to sender : " + message);

            // Broadcast all connected client
            this.broadcast?.("echo", "echo to all : " + message);
        });
    }

    onJoin(client: SandboxPlayer) {

    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        
    }
}
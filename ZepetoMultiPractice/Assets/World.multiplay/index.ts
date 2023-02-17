import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";

export default class extends Sandbox {

    // ���� �����ɶ� 1ȸ ȣ��
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

    // �� �ڷᱸ�� - Ŭ���̾�Ʈ Ű : sessionId, �� : client
    private map = new Map<string, SandboxPlayer>();

    // Ŭ���̾�Ʈ�� �뿡 ������ �� ȣ��
    onJoin(client: SandboxPlayer) {
        console.log(`OnJoin!!!!`);

        this.map.set(client.sessionId, client);
        console.log(this.map.size); // �뿡 ������ Ŭ���̾�Ʈ ��

    }

    // Ŭ���̾�Ʈ�� �뿡�� ������ �� ȣ��
    onLeave(client: SandboxPlayer, consented?: boolean) {
        console.log(`OnLeave!!!!`);
        this.map.delete(client.sessionId);
        console.log(this.map.size);
    }

    // sendboxOption���� ������ tickInterval���� �ݺ������� ȣ��
    onTick(deltaTime: number) {

    }
}